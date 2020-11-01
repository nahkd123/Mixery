import MIDIFile from "../../mididev/midifile.js";
import { AudioClip, MIDIClip } from "../../mixerycore/clips.js";
import { Session } from "../../mixerycore/session.js";
import { Tools } from "../../mixerycore/tools.js";
import { ArrayBufferLoader, AudioBufferLoader } from "../../utils/loader.js";
import { msToBeats } from "../../utils/msbeats.js";
import { BeatSnapPreset, fixedSnapCeil, snap } from "../../utils/snapper.js";
import { AudioClipExplorerContent } from "../explorer.js";
import { updateCanvasSize, UserInterface } from "../ui.js";
import { PlaylistBar } from "./playlistbar.js";
import { TimelineBar } from "./timeline.js";

export class PlaylistInterface {
    ui: UserInterface;
    session: Session;
    element: HTMLDivElement;

    editorBar: PlaylistBar;
    timelineBar: TimelineBar;
    tracksList: HTMLDivElement;
    tracksContainer: HTMLDivElement;
    
    constructor(ui: UserInterface) {
        this.ui = ui;
        this.session = ui.session;
    }

    applyUpdate() {
        this.editorBar = new PlaylistBar(this.ui);
        this.editorBar.element = this.element.querySelector("div.editorbar");
        this.editorBar.applyUpdate();

        this.timelineBar = new TimelineBar(this.ui);
        this.timelineBar.canvas = this.element.querySelector("canvas.seekbar");
        updateCanvasSize(this.timelineBar.canvas);
        this.timelineBar.ctx = this.timelineBar.canvas.getContext("2d");

        this.tracksList = this.element.querySelector("div.sidebar.tracks");
        this.tracksContainer = this.element.querySelector("div.trackscontainer");

        // Related to clips thing
        let globalCanvasMouseDown = false;
        let beginBeat: number;
        let tool: Tools;
        let beginOffsetX = 0;
        let movingClip = false;
        let resizingClip = false;
        let clipOldOffset = 0;
        let clipOldLength = 0;

        // Add events
        (<HTMLDivElement> this.element.querySelector("div.bartrackadd")).addEventListener("click", (event) => {
            let track = this.session.playlist.addTrack();

            let ele = document.createElement("div");
            ele.className = "bartrackentry on";
            
            let volumeToggle = document.createElement("div");
            volumeToggle.className = "volumetoggle";
            let label = document.createElement("div");
            label.className = "label";
            label.textContent = track.name;

            ele.append(volumeToggle, label);
            this.tracksList.insertBefore(ele, this.tracksList.lastChild.previousSibling);

            let canvas = document.createElement("canvas");
            canvas.className = "track";
            this.tracksContainer.insertBefore(canvas, this.tracksContainer.lastChild.previousSibling);
            updateCanvasSize(canvas);

            track.sidebarElement = ele;
            track.viewCanvas = canvas;

            volumeToggle.addEventListener("click", event => {
                track.unmuted = !track.unmuted;
                if (track.unmuted) ele.classList.add("on");
                else ele.classList.remove("on");

                this.ui.canvasRenderUpdate();
            });

            // Click to add clip wee
            canvas.addEventListener("mousedown", event => {
                globalCanvasMouseDown = true;
                beginOffsetX = event.offsetX;
                beginBeat = snap(event.offsetX / this.session.pxPerBeat + this.session.scrolledBeats, ...BeatSnapPreset);
                tool = this.session.playlist.selectedTool;
                // console.log(clickedBeat);

                let self = this;
                function deleteClipAtCursor() {
                    globalCanvasMouseDown = false;
                    for (let i = 0; i < track.clips.length; i++) {
                        const clip = track.clips[i];
                        if (beginBeat >= clip.offset && beginBeat <= clip.offset + clip.length) {
                            track.clips.splice(i, 1);
                            if (self.session.playlist.selectedClip === clip) self.session.playlist.selectedClip = undefined;
                            return;
                        }
                    }
                }

                if (tool === Tools.NOTHING) {
                    if (event.button === 2) {
                        deleteClipAtCursor();
                    } else {
                        this.session.seeker = beginBeat;
                        this.ui.canvasRenderUpdate();
                    }
                } else if (tool === Tools.PENCIL) {
                    if (event.button === 2) {
                        deleteClipAtCursor();
                    } 
                } else if (tool === Tools.MOVE) {
                    this.session.scrollFriction = Math.round(this.session.scrollFriction * 0.2);
                    this.session.playlist.selectedClip = undefined;
                    for (let i = 0; i < track.clips.length; i++) {
                        const clip = track.clips[i];
                        const drawX = clip.offset * this.session.pxPerBeat - this.session.scrolledPixels;
                        const drawW = clip.length * this.session.pxPerBeat;
                        const drawXResize = drawX + drawW - 5;
                        const drawXEnd = drawX + drawW;
                        if (event.offsetX >= drawX && event.offsetX <= drawXEnd) {
                            this.session.playlist.selectedClip = clip;
                            movingClip = true;
                            resizingClip = event.offsetX >= drawXResize;
                            clipOldOffset = clip.offset;
                            clipOldLength = clip.length;
                            break;
                        }
                    }
                    this.ui.canvasRenderUpdate();
                }
            });

            let buildupFriction = false;
            canvas.addEventListener("contextmenu", event => {
                event.preventDefault();
                this.ui.canvasRenderUpdate();
            });
            canvas.addEventListener("mousemove", event => {
                if (buildupFriction) this.session.scrollFriction -= event.movementX;
                if (!globalCanvasMouseDown) return;
                const cursorBeat = snap(event.offsetX / this.session.pxPerBeat + this.session.scrolledBeats, ...BeatSnapPreset);
                if (tool === Tools.NOTHING) {
                    this.session.seeker = cursorBeat;
                    if (this.session.playing) this.session.stopAndThenPlay();

                    this.ui.canvasRenderUpdate();
                } else if (tool === Tools.MOVE) {
                    if (!movingClip) {
                        this.session.scrolledPixels -= event.movementX;
                        if (this.session.scrolledBeats < 0) this.session.scrolledBeats = 0;
                    } else {
                        let clip = this.session.playlist.selectedClip;
                        if (!resizingClip) clip.offset = snap(clipOldOffset + ((event.offsetX - beginOffsetX) / this.session.pxPerBeat), ...BeatSnapPreset);
                        else clip.length = snap(clipOldLength + ((event.offsetX - beginOffsetX) / this.session.pxPerBeat), ...BeatSnapPreset);
                    }
                    this.ui.canvasRenderUpdate();
                }
            });

            canvas.addEventListener("mouseup", event => {
                globalCanvasMouseDown = false;
                const cursorBeat = snap(event.offsetX / this.session.pxPerBeat + this.session.scrolledBeats, ...BeatSnapPreset);
                if (tool === Tools.PENCIL) {
                    if (event.button === 2) {}
                    else {
                        if (this.session.plugins.selected === undefined) {
                            if (this.session.notifications.hasTag("selectplugin")) return;
                            this.session.notifications.push({
                                desc: "You need to select a plugin to continue",
                                tags: ["selectplugin"],
                                duration: 3000
                            });
                            return;
                        }
                        let targetPlugin = this.session.plugins.selected;
    
                        let clipLength = cursorBeat - beginBeat || 1;
                        if (clipLength <= 0) return;

                        let clip = new MIDIClip(targetPlugin.generator);
                        clip.name = targetPlugin.name;
                        clip.offset = beginBeat;
                        clip.length = clipLength;
                        track.clips.push(clip);
    
                        this.session.playlist.selectedClip = clip;
                        this.ui.canvasRenderUpdate();
                    }
                } else if (tool === Tools.MOVE) {
                    if (movingClip) {
                        movingClip = false;
                        resizingClip = false;
                        return;
                    }

                    buildupFriction = true;
                    setTimeout(() => {
                        buildupFriction = false;
                    }, 30);
                }
            });

            canvas.addEventListener("mouseenter", event => {
                if (!globalCanvasMouseDown) return;

                if (tool === Tools.MOVE && movingClip && !resizingClip) {
                    track.clips.push(this.session.playlist.selectedClip);
                }
            });

            canvas.addEventListener("mouseleave", event => {
                if (!globalCanvasMouseDown) return;

                if (tool === Tools.MOVE && movingClip && !resizingClip) {
                    track.clips.splice(track.clips.indexOf(this.session.playlist.selectedClip), 1);
                }
            });
            
            canvas.addEventListener("dragover", event => {
                event.preventDefault();
            });
            canvas.addEventListener("drop", event => {
                event.preventDefault();
                let files = event.dataTransfer.files;
                if (files.length === 0) return;
                if (files.length === 1) {
                    // File filtering (ik this succ)
                    const file = files.item(0);
                    if (file.type === "audio/mid") {
                        if (this.session.plugins.selected === undefined) {
                            if (this.session.notifications.hasTag("selectplugin")) return;
                            this.session.notifications.push({
                                desc: "You need to select a plugin to continue",
                                tags: ["selectplugin"],
                                duration: 3000
                            });
                            return;
                        }
                        let targetPlugin = this.session.plugins.selected;
                        
                        file.arrayBuffer().then(buffer => {
                            let midi = new MIDIFile(new Uint8Array(buffer));
                            let clip = new MIDIClip(targetPlugin.generator);
                            if (midi.header.format === "doubleTracks") {
                                clip.notes = midi.tracks[1].notes;
                                clip.length = midi.tracks[1].trackLength;
                            }
                            
                            clip.name = file.name;
                            clip.offset = this.session.seeker;
                            track.clips.push(clip);

                            this.session.playlist.selectedClip = clip;
                            this.ui.canvasRenderUpdate();

                        });
                        return;
                    }
                }

                let arrayBuffersAsync: Promise<ArrayBuffer>[] = [];
                let audioBuffersNames: string[] = [];
                for (let i = 0; i < files.length; i++) {
                    const file = files.item(i);
                    if (!file.name.endsWith(".mxyaudio") && !file.type.startsWith("audio/")) continue;

                    audioBuffersNames[i] = file.name;
                    arrayBuffersAsync[i] = file.arrayBuffer();
                }
                let arrBuffersLoader = new ArrayBufferLoader(arrBuffers => {

                    let audioBuffersAsync: Promise<AudioBuffer>[] = [];
                    arrBuffers.forEach((arr, index) => {
                        // audioBuffersAsync[index] = this.session.audioEngine.audio.decodeAudioData(arr);
                        audioBuffersAsync[index] = this.session.decodeAudio(arr, audioBuffersNames[index]);
                    });

                    new AudioBufferLoader(audio => {
                        let previousOffset = 0;

                        audio.forEach((buffer, index) => {
                            let clip = new AudioClip(buffer, this.ui.mixer.mixerTracks.selected.track);
                            clip.length = msToBeats(buffer.duration * 1000, this.session.bpm);
                            clip.offset = this.session.seeker + previousOffset;
                            clip.name = audioBuffersNames[index];
                            previousOffset += fixedSnapCeil(clip.length, 0.25);

                            track.clips.push(clip);
                            console.log(clip);
                        });
                        this.ui.canvasRenderUpdate();
                    }, ...audioBuffersAsync)
                }, ...arrayBuffersAsync);

            });

            // Explorer contents consumer
            this.ui.explorer.addContentConsumer(canvas, (content) => {
                if (content instanceof AudioClipExplorerContent) {
                    let clip = content.createClip(this.session);
                    clip.offset = this.session.seeker;
                    clip.mixer = this.ui.mixer.mixerTracks.selected.track || this.session.audioEngine.mixer.master;
                    track.clips.push(clip);
                    this.session.playlist.selectedClip = clip;
                    this.ui.canvasRenderUpdate();
                }
            });

            this.ui.canvasRenderUpdate();
        });

        let scrollLink = false;
        this.tracksList.addEventListener("scroll", event => {
            if (!scrollLink) {
                scrollLink = true;
                this.tracksContainer.scrollTo(0, this.tracksList.scrollTop);
            } else scrollLink = false;
        });
        this.tracksContainer.addEventListener("scroll", event => {
            if (!scrollLink) {
                scrollLink = true;
                this.tracksList.scrollTo(0, this.tracksContainer.scrollTop);
            } else scrollLink = false;
        });
        this.tracksContainer.addEventListener("wheel", event => {
            this.session.scrolledPixels += event.shiftKey? event.deltaY : event.deltaX;
            if (this.session.scrolledBeats < 0) this.session.scrolledBeats = 0;
            this.ui.canvasRenderUpdate();
        });

        this.timelineBar.applyUpdate();
    }
}