import MIDIFile from "../../mididev/midifile.js";
import { ToolComponents } from "../../mixeryapi/toolcomponent.js";
import { AudioClip, MIDIClip } from "../../mixerycore/clips.js";
import { ArrayBufferLoader, AudioBufferLoader } from "../../utils/loader.js";
import { msToBeats } from "../../utils/msbeats.js";
import { fixedSnapCeil } from "../../utils/snapper.js";
import { AudioClipExplorerContent } from "../explorer.js";
import { updateCanvasSize } from "../ui.js";
import { PlaylistBar } from "./playlistbar.js";
import { TimelineBar } from "./timeline.js";
export class PlaylistInterface {
    constructor(ui) {
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
        let mouseDown = false;
        this.element.querySelector("div.bartrackadd").addEventListener("click", (event) => {
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
            let getClipAt = (beat) => {
                for (let i = 0; i < track.clips.length; i++) {
                    const clip = track.clips[i];
                    if (beat >= clip.offset && beat <= (clip.offset + clip.length))
                        return clip;
                }
                return undefined;
            };
            volumeToggle.addEventListener("click", event => {
                track.unmuted = !track.unmuted;
                if (track.unmuted)
                    ele.classList.add("on");
                else
                    ele.classList.remove("on");
                this.ui.canvasRenderUpdate();
            });
            canvas.addEventListener("mousemove", event => {
                const selectedTool = this.ui.selectedTool;
                if (!ToolComponents.instanceOf.PlaylistTool(selectedTool))
                    return;
                let eventpkg = {
                    parent: event,
                    playlist: this,
                    mouseDown,
                    beat: this.session.scrolledBeats + event.offsetX / this.session.pxPerBeat,
                    clickedTrack: track,
                    clickedClip: getClipAt(this.session.scrolledBeats + event.offsetX / this.session.pxPerBeat)
                };
                selectedTool.playlistMouseMove(eventpkg);
            });
            canvas.addEventListener("mousedown", event => {
                const selectedTool = this.ui.selectedTool;
                if (!ToolComponents.instanceOf.PlaylistTool(selectedTool))
                    return;
                let eventpkg = {
                    parent: event,
                    playlist: this,
                    mouseDown: mouseDown = true,
                    beat: this.session.scrolledBeats + event.offsetX / this.session.pxPerBeat,
                    clickedTrack: track,
                    clickedClip: getClipAt(this.session.scrolledBeats + event.offsetX / this.session.pxPerBeat)
                };
                selectedTool.playlistMouseDown(eventpkg);
            });
            canvas.addEventListener("mouseup", event => {
                const canvasPx = event.pageX - canvas.getBoundingClientRect().left;
                const selectedTool = this.ui.selectedTool;
                let eventpkg = {
                    parent: event,
                    playlist: this,
                    mouseDown: mouseDown = false,
                    beat: this.session.scrolledBeats + canvasPx / this.session.pxPerBeat,
                    clickedTrack: track,
                    clickedClip: getClipAt(this.session.scrolledBeats + event.offsetX / this.session.pxPerBeat)
                };
                selectedTool.playlistMouseUp(eventpkg);
            });
            canvas.addEventListener("contextmenu", event => { event.preventDefault(); });
            canvas.addEventListener("dragover", event => {
                event.preventDefault();
            });
            canvas.addEventListener("drop", event => {
                event.preventDefault();
                let files = event.dataTransfer.files;
                if (files.length === 0)
                    return;
                if (files.length === 1) {
                    const file = files.item(0);
                    if (file.type === "audio/mid") {
                        if (this.session.plugins.selected === undefined) {
                            if (this.session.notifications.hasTag("selectplugin"))
                                return;
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
                            let res = midi.toResource(file.name);
                            this.session.resources.addResource(res);
                            this.session.resources.selectedResource = res;
                            let clip = new MIDIClip(res, targetPlugin.generator);
                            if (midi.header.format === "doubleTracks") {
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
                let arrayBuffersAsync = [];
                let audioBuffersNames = [];
                for (let i = 0; i < files.length; i++) {
                    const file = files.item(i);
                    if (!file.name.endsWith(".mxyaudio") && !file.type.startsWith("audio/"))
                        continue;
                    audioBuffersNames[i] = file.name;
                    arrayBuffersAsync[i] = file.arrayBuffer();
                }
                let arrBuffersLoader = new ArrayBufferLoader(arrBuffers => {
                    let audioBuffersAsync = [];
                    arrBuffers.forEach((arr, index) => {
                        audioBuffersAsync[index] = this.session.decodeAudio(arr, audioBuffersNames[index]);
                    });
                    new AudioBufferLoader(audio => {
                        let previousOffset = 0;
                        audio.forEach((buffer, index) => {
                            let res = this.session.resources.newAudioResource(buffer);
                            res.name = audioBuffersNames[index];
                            let clip = new AudioClip(res, this.ui.mixer.mixerTracks.selected.track);
                            clip.length = msToBeats(buffer.duration * 1000, this.session.bpm);
                            clip.offset = this.session.seeker + previousOffset;
                            clip.name = audioBuffersNames[index];
                            previousOffset += fixedSnapCeil(clip.length, 0.25);
                            track.clips.push(clip);
                            console.log(clip);
                        });
                        this.ui.canvasRenderUpdate();
                    }, ...audioBuffersAsync);
                }, ...arrayBuffersAsync);
            });
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
            }
            else
                scrollLink = false;
        });
        this.tracksContainer.addEventListener("scroll", event => {
            if (!scrollLink) {
                scrollLink = true;
                this.tracksList.scrollTo(0, this.tracksContainer.scrollTop);
            }
            else
                scrollLink = false;
        });
        this.tracksContainer.addEventListener("wheel", event => {
            this.session.scrolledPixels += event.shiftKey ? event.deltaY : event.deltaX;
            if (this.session.scrolledBeats < 0)
                this.session.scrolledBeats = 0;
            this.ui.canvasRenderUpdate();
        });
        this.timelineBar.applyUpdate();
    }
}