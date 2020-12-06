import { Playlist } from "./playlist.js";
import { GeneratorsPlugins, PluginsManager } from "./plugins.js";
import { NotificationsManager } from "../notifications/notificationsmgr.js";
import { beatsToMS, msToBeats } from "../utils/msbeats.js";
import { AudioClip, AutomationClip, MIDIClip } from "./clips.js";
import ContextMenu, { ContextMenuEntry } from "../contextmenus/menu.js";
import MoveableWindow from "../windows/window.js";
import { MixeryHTMLDocuments } from "../mixeryui/htmldocuments.js";
import MixeryCanvasEngine from "../mixerycanvas/engine.js";
import MixeryAudioEngine from "../mixeryaudio/engine.js";
import RenderableGainNode from "../mixeryaudio/nodes/gain.js";
import RenderableAudioBufferSourceNode from "../mixeryaudio/nodes/audiobuffer.js";
import { UserInterface } from "../mixeryui/ui.js";
import RenderableAudioParam from "../mixeryaudio/automations/param.js";
import MIDIManager from "../mididev/manager.js";
import { MixeryFileFormat } from "../fileformat/mixeryfile.js";
import download from "../utils/downloader.js";
import { AudioEncodersManager } from "../encoders/encoder.js";
import MixeryAudioEncoder from "../encoders/mixeryaudio.js";
import WaveFileAudioEncoder from "../encoders/wavefile.js";
import { InternalAppPlugins } from "./appplugins/appplugins.js";
import ResourcesStore from "./resources.js";
import { upload } from "../utils/uploader.js";
import { ByteStream } from "../fileformat/filestream.js";

export class Session {
    audioEngine: MixeryAudioEngine;

    appPlugins: InternalAppPlugins.AppPluginsManager;

    appControls = new SessionControls();
    menus: SessionMenus;

    playlist: Playlist;
    plugins: GeneratorsPlugins;
    pluginsManager: PluginsManager;
    notifications: NotificationsManager;

    midi: MIDIManager;
    encoders: AudioEncodersManager;

    // General/Project metadata
    projectName: string = "Untitled Project";
    projectDesc: string = "Write some text here...";
    projectCreationTime = Date.now();
    bpm: number = 120;
    resources: ResourcesStore;

    // Views
    ui: UserInterface;
    statusBox: HTMLDivElement;

    pxPerBeat: number = 100;
    pxPerBeatTo: number = 100;
    scrolledBeats: number = 0;
    get scrolledPixels() {return this.pxPerBeat * this.scrolledBeats;}
    set scrolledPixels(value: number) {this.scrolledBeats = value / this.pxPerBeat;}
    scrollFriction: number = 0;
    
    realScrolledBeats: number = 0;
    get realScrolledPixels() {return this.pxPerBeat * this.realScrolledBeats;}
    set realScrolledPixels(value: number) {this.realScrolledBeats = value / this.pxPerBeat;}

    // Player
    seeker: number = 0;
    playing: boolean = false;
    playTimestamp: number = 0;
    get playedLength() {return this.playing? (Date.now() - this.playTimestamp) : 0;}
    get playedBeats() {return msToBeats(this.playedLength, this.bpm);}

    // Dedicated to clip editor
    clipEditor = {
        noteLength: 0.125,
        availableLengths: [0.0625, 0.125, 0.1875, 0.25, 0.3125, 0.375, 0.4375, 0.5, 0.5625, 0.625, 0.6875, 0.75, 0.8125, 0.875, 0.9375, 1],
        // Yes i've used a tool to generate these values,

        verticalZoom: 25, // 25px height per note
        verticalScroll: 0
    };

    // Audio Clips and Automation Clips
    playingAudios: {
        gain: RenderableGainNode,
        source: RenderableAudioBufferSourceNode
    }[] = [];
    automatingParams: RenderableAudioParam[] = [];

    // Settings
    settings = {
        _title: "Settings",

        playback: {
            _title: "Playback",
            autoScroll: true,
            autoScrollPercentage: 0.75
        },
        accessibility: {
            _title: "Accessibility",
            doubleClickSpeed: 350
        },
        rendering: {
            _title: "Rendering settings",
            renderNotes: true
        },
        performance: {
            _title: "Performance settings",
            realTimeRendering: true // Place nodes in real time (which reduce load for AudioContext)
        }
    };
    keyboardShortcuts: {
        name: string,
        code: string,
        action: () => void
    }[] = [];

    // Extras
    isElectron: boolean = false;
    documents: MixeryHTMLDocuments;

    constructor() {
        this.audioEngine = new MixeryAudioEngine();
        this.appPlugins = new InternalAppPlugins.AppPluginsManager(this);

        this.menus = new SessionMenus(this);

        this.midi = new MIDIManager(this);
        
        this.encoders = new AudioEncodersManager();
        this.encoders.addEncoder(new MixeryAudioEncoder());
        this.encoders.addEncoder(new WaveFileAudioEncoder());
        this.encoders.selectedEncoder = this.encoders.encoders[0];

        this.resources = new ResourcesStore();

        this.playlist = new Playlist(this);
        this.plugins = new GeneratorsPlugins(this);
        this.pluginsManager = new PluginsManager();
        this.notifications = new NotificationsManager();

        this.statusBox = document.querySelector("div.topbarstatus");
        this.statusBox.textContent = "Ready";

        this.midi.addConnectedDevices();

        // Also add keyboard events
        document.addEventListener("keydown", event => {
            const keyStr = (event.ctrlKey? "Ctrl + " : "") + (event.altKey? "Alt + " : "") + (event.shiftKey? "Shift + " : "") + event.code;
            if ((event.target as HTMLDivElement).isContentEditable || event.target instanceof HTMLInputElement) return;
            
            switch (keyStr) {
                case "Ctrl + KeyR": this.notifications.push({
                    title: "a",
                    desc: "Use Ctrl + Shift + R to reload instead.",
                    duration: 2500,
                    tags: ["reloadshortcut"]
                });
                event.preventDefault(); break;
                case "Ctrl + Shift + KeyR":
                case "F12": break;
                default: event.preventDefault(); break;
            }
            this.keyboardShortcuts.forEach(shortcut => {
                if (shortcut.code === keyStr) shortcut.action();
            });
        });

        this.documents = new MixeryHTMLDocuments();
    }

    oldScrolledBeat: number;
    scheduledPlayTasks: number[] = [];
    play(disableRealTimeRendering = false) {
        if (this.playing) return;

        let self = this;
        this.oldScrolledBeat = this.scrolledBeats;
        function realPlay() {
            self.playing = true;
            self.playTimestamp = Date.now();

            // Pass all clips to all generators
            self.playlist.tracks.forEach(track => {
                if (!track.unmuted) return;

                track.clips.forEach(clip => {
                    if (clip.offset + clip.length < self.seeker) return;
                    
                    if (!disableRealTimeRendering && self.settings.performance.realTimeRendering) {
                        if (clip instanceof MIDIClip) {
                            clip.notes.forEach(note => {
                                // Play note one by one
                                if (clip.offset + note.start - self.seeker >= 0) self.scheduledPlayTasks.push((setTimeout(() => {
                                    clip.generator.playNote(note.note, note.sensitivity, 0, note.duration);
                                }, beatsToMS(clip.offset + note.start - self.seeker, self.bpm)) as unknown) as number);
                            });
                        } else if (clip instanceof AudioClip) {
                            const playDuration = beatsToMS(clip.length, self.bpm) / 1000;
                            if (playDuration <= 0) return;

                            self.scheduledPlayTasks.push((setTimeout(() => {
                                let gain = self.audioEngine.createGain();
                                let source = self.audioEngine.createBufferSource(clip.buffer);
        
                                source.connect(gain);
                                gain.connect(clip.mixer !== undefined? clip.mixer.input : self.audioEngine.mixer.master.input);

                                source.start(
                                    self.audioEngine.liveTime,
                                    beatsToMS(Math.max(self.seeker - clip.offset, 0) + clip.audioOffset, self.bpm) / 1000,
                                    playDuration
                                );
                                self.playingAudios.push({gain, source});
                            }, beatsToMS(clip.offset - self.seeker, self.bpm)) as unknown) as number);
                        } else if (clip instanceof AutomationClip) {
                            // We'll apply every nodes atm
                            self.automatingParams.push(clip.param);
                            clip.automation.applyBPM(clip.param, self.bpm, 1, beatsToMS(clip.offset, self.bpm));
                        }
                    } else {
                        if (clip instanceof MIDIClip) clip.generator.playClip(clip, clip.offset - self.seeker);
                        else if (clip instanceof AudioClip) {
                            const playDuration = beatsToMS(clip.length, self.bpm) / 1000;
                            if (playDuration <= 0) return;
                            let gain = self.audioEngine.createGain();
                            console.log(gain.rendererNode);
                            let source = self.audioEngine.createBufferSource(clip.buffer);
    
                            source.connect(gain);
                            gain.connect(clip.mixer !== undefined? clip.mixer.input : self.audioEngine.mixer.master.input);
    
                            source.start(
                                self.audioEngine.liveTime + beatsToMS(Math.max(clip.offset - self.seeker, 0), self.bpm) / 1000,
                                beatsToMS(Math.max(self.seeker - clip.offset, 0) + clip.audioOffset, self.bpm) / 1000,
                                playDuration
                            );
    
                            self.playingAudios.push({gain, source});
                        } else if (clip instanceof AutomationClip) {
                            self.automatingParams.push(clip.param);
                            clip.automation.applyBPM(clip.param, self.bpm, 1, beatsToMS(clip.offset, self.bpm));
                        }
                    }
                });
            });
        }

        if (this.audioEngine.state === "suspended") this.audioEngine.audio.resume().then(realPlay);
        else realPlay();
    }
    stop() {
        this.playing = false;

        // Stop all generators
        this.plugins.generators.forEach(generatorEntry => {
            generatorEntry.generator.stopPlayingClips();
        });

        // Stop all playing audio clips
        this.playingAudios.forEach(clip => {
            clip.gain.disconnect();
            clip.source.stop();
        });

        this.automatingParams.forEach(param => {
            param.cancelScheduledValues(this.audioEngine.liveTime);
        });

        // Stop scheduled tasks
        this.scheduledPlayTasks.forEach(taskId => {clearTimeout(taskId);});
        this.scheduledPlayTasks = [];
    }
    stopAndThenPlay() {
        this.stop();
        this.play();
    }
    playToggle() {
        if (this.playing) this.stop();
        else this.play();
    }

    processTopbar(ele: HTMLDivElement) {
        function linkMenu(div: HTMLDivElement, menu: ContextMenu) {
            div.addEventListener("click", event => {
                menu.openMenu(div.offsetLeft, ele.offsetHeight);
            });
        }

        linkMenu(ele.querySelector("div#file.topbarbutton"), this.menus.file);
        linkMenu(ele.querySelector("div#tools.topbarbutton"), this.menus.tools);
        linkMenu(ele.querySelector("div#help.topbarbutton"), this.menus.help);
    }

    electronAppEnabled() {
        this.menus.file.entries.push(new ContextMenuEntry("Close", () => {
            this.appControls.close();
        }));
        this.menus.help.entries.push(new ContextMenuEntry("Mixery Electron Source Code", () => {
            window.open("https://github.com/nahkd123/Mixery-Electron");
        }));

        console.log("Electron features enabled. It might cause some problem if you're trying to use Electron-only features.");
    }

    async saveProject(name = this.projectName + ".mxyproj") {
        console.log("[main] Saving project...");
        let stream = await MixeryFileFormat.convertToProjectFile(this);
        let blob = stream.convertToBlob();

        download(blob, name);
        console.log("[main] Saved project!");
    }

    async decodeAudio(input: ArrayBuffer | Blob, name: string) {
        let data = input instanceof ArrayBuffer? input : await input.arrayBuffer();
        if (name.endsWith(".mxyaudio")) {
            let audioFile = MixeryFileFormat.Audio.readAudioFile(data);
            if (audioFile instanceof AudioBuffer) return audioFile;
            else await this.audioEngine.decodeAudio(audioFile);
        } else return await this.audioEngine.decodeAudio(data);
    }

    /**
     * Reset session, including resources store and playlists, but not loaded plugins and
     * installed bundles
     */
    resetSession() {
        this.playlist.resetAll();
        this.resources.resetAll();
        while (this.ui.mixer.mixerTracks.element.firstChild) this.ui.mixer.mixerTracks.element.firstChild.remove();
        while ((<HTMLDivElement> this.ui.mixer.mixerTrackPlugins.element.firstChild).className !== "pluginadd") this.ui.mixer.mixerTrackPlugins.element.firstChild.remove();
        this.audioEngine.resetAll();
        this.ui.mixer.mixerTracks.addMixerTrackElement(this.audioEngine.mixer.master);
        while ((<HTMLDivElement> this.ui.plugins.pluginsListing.firstChild).className !== "pluginadd") this.ui.plugins.pluginsListing.firstChild.remove();

        this.projectName = "Untitled Project";
        this.projectDesc = "Write some text here...";
        this.projectCreationTime = Date.now();

        this.ui.canvasRenderUpdate();
    }
}

export class SessionControls {
    /**
     * Close current app. Only works in Electron BrowserWindow
     */
    close() {
        // TODO: we should ask for discarding any changes in here
        close();
    }
}

export class SessionMenus {
    file: ContextMenu = new ContextMenu();
    tools: ContextMenu = new ContextMenu();
    help: ContextMenu = new ContextMenu();

    windows = {
        file: {
            export: new MoveableWindow("Export", 0, 0)
        },
        tools: {
            bpmTapper: new MoveableWindow("BPM Tapper", 0, 0, 200, 250)
        }
    };

    constructor(session: Session) {
        // this.windows.file.export;
        this.file.entries.push(new ContextMenuEntry("Open", () => {
            let asyncFunc = async function() {
                let files = await upload("*.mxyproj");
                if (files.length === 0) return;

                let file = files.item(0);
                MixeryFileFormat.convertFromProjectFile(new ByteStream.ReadableStream(await file.arrayBuffer()), session);
            };
            asyncFunc();
        }));
        this.file.entries.push(new ContextMenuEntry("Import", () => {}));
        this.file.entries.push(new ContextMenuEntry("Export", () => {
            this.windows.file.export.show();
        }));
        this.file.entries.push(new ContextMenuEntry("Save", () => {
            let asyncFunc = async function() {
                download((await MixeryFileFormat.convertToProjectFile(session)).convertToBlob(), session.projectName + ".mxyproj");
            }
            asyncFunc();
        }));
        this.file.entries.push(new ContextMenuEntry("Erase Everything!", () => {
            session.resetSession();
        }));

        this.tools.entries.push(new ContextMenuEntry("BPM Tapping", () => {
            this.windows.tools.bpmTapper.show();
        }));
        
        this.help.entries.push(new ContextMenuEntry("Documentation", () => {
            window.open("https://github.com/nahkd123/Mixery/wiki");
        }));
        this.help.entries.push(new ContextMenuEntry("About", () => {}));
        this.help.entries.push(new ContextMenuEntry("License info (GPL v3.0)", () => {
            window.open("https://www.gnu.org/licenses/gpl-3.0.html");
        }));
        this.help.entries.push(new ContextMenuEntry("Source Code!", () => {
            window.open("https://github.com/nahkd123/Mixery");
        }));
    }
}