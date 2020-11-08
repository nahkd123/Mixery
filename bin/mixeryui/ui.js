import { msToString } from "../utils/numberround.js";
import { beatsToMS } from "../utils/msbeats.js";
import { ExplorerPane } from "./explorer.js";
import { PlaylistInterface } from "./ui/playlist.js";
import { ClipEditorInterface } from "./ui/clipeditor.js";
import { PluginsInterface } from "./ui/plugins.js";
import { tbWindowsProcess } from "./ui/tbwindows.js";
import { MixerInterface } from "./ui/mixer.js";
let canvasSizeDynamicUpdate = new Map();
export function updateCanvasSize(canvas, onResize) {
    document.addEventListener("resize", () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    });
    if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
    }
    else if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        onCanvasSizesUpdate();
        if (onResize !== undefined)
            onResize(canvas);
    }
    canvasSizeDynamicUpdate.set(canvas, onResize !== undefined ? onResize : () => { });
}
let onCanvasSizesUpdate = () => { };
setInterval(() => {
    let updated = false;
    canvasSizeDynamicUpdate.forEach((onResize, canvas) => {
        if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0)
            return; // Without this, the browser is gonna hang. idk why
        if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            updated = true;
            onResize(canvas);
        }
    });
    if (updated)
        onCanvasSizesUpdate();
}, 750);
export class UserInterface {
    constructor(session) {
        this.updateNextFrame = false;
        this.session = session;
        this.playlist = new PlaylistInterface(this);
        this.plugins = new PluginsInterface(this);
        this.clipEditor = new ClipEditorInterface(this);
        this.mixer = new MixerInterface(this);
        tbWindowsProcess(session);
        this.session.ui = this;
    }
    applyUpdate() {
        this.explorer = new ExplorerPane(this, this.element.querySelector("div.pane.explorer"));
        this.playlist.element = this.element.querySelector("div.pane.editor");
        this.playlist.applyUpdate();
        this.plugins.element = this.element.querySelector("div.pane.plugins");
        this.plugins.applyUpdate();
        this.clipEditor.element = this.element.querySelector("div.pane.clipeditor");
        this.clipEditor.applyUpdate();
        this.mixer.applyUpdate();
        onCanvasSizesUpdate = () => {
            this.canvasRenderUpdate();
        };
    }
    canvasRenderUpdate() {
        this.updateNextFrame = true;
    }
    renderLoop() {
        if (this.session.playing || this.updateNextFrame || this.session.scrollFriction !== 0 || this.session.pxPerBeatTo !== this.session.pxPerBeat) {
            this.updateNextFrame = false;
            if (this.session.scrollFriction !== 0) {
                this.session.scrollFriction -= this.session.scrollFriction > 0 ? 1 : -1;
                this.session.scrolledPixels += this.session.scrollFriction;
                if (this.session.scrolledBeats < 0.00000001) {
                    this.session.scrollFriction = 0;
                    this.session.scrolledBeats = 0;
                }
            }
            if (this.session.playing && this.session.settings.playback.autoScroll) {
                const globalSeekerPos = this.session.playedBeats + this.session.seeker;
                const localSeekerPos = globalSeekerPos - this.session.scrolledBeats;
                const spaceSeekerScroller = this.session.seeker - this.session.oldScrolledBeat;
                this.session.scrolledBeats += localSeekerPos - spaceSeekerScroller;
            }
            if (this.session.pxPerBeatTo !== this.session.pxPerBeat) {
                this.session.pxPerBeat += (this.session.pxPerBeatTo - this.session.pxPerBeat) * 0.5;
            }
            this.playlist.timelineBar.render();
            this.session.playlist.tracks.forEach(track => {
                track.renderUpdate();
            });
            this.clipEditor.render();
            this.playlist.editorBar.timecode.textContent = msToString(beatsToMS(this.session.seeker, this.session.bpm) + (this.session.playing ? this.session.playedLength : 0));
        }
    }
    get pluginsTray() { return this.element.classList.contains("pluginsopen"); }
    set pluginsTray(val) {
        if (val)
            this.element.classList.add("pluginsopen");
        else
            this.element.classList.remove("pluginsopen");
    }
    get clipEditorTray() { return this.element.classList.contains("clipeditoropen"); }
    set clipEditorTray(val) {
        if (val)
            this.element.classList.add("clipeditoropen");
        else
            this.element.classList.remove("clipeditoropen");
    }
    get dragMode() { return this.element.classList.contains("dragmode"); }
    set dragMode(val) {
        if (val)
            this.element.classList.add("dragmode");
        else
            this.element.classList.remove("dragmode");
    }
}