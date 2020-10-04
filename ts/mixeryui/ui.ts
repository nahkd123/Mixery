import { Session } from "../mixerycore/session.js";
import { msToString } from "../utils/numberround.js";
import { beatsToMS } from "../utils/msbeats.js";
import { ExplorerPane } from "./explorer.js";
import { PlaylistInterface } from "./ui/playlist.js";
import { ClipEditorInterface } from "./ui/clipeditor.js";
import { PluginsInterface } from "./ui/plugins.js";
import { tbWindowsProcess } from "./ui/tbwindows.js";

let canvasSizeDynamicUpdate: HTMLCanvasElement[] = [];
export function updateCanvasSize(canvas: HTMLCanvasElement) {
    document.addEventListener("resize", () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    });
    if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        onCanvasSizesUpdate();
    }

    canvasSizeDynamicUpdate.push(canvas);
}
let onCanvasSizesUpdate = () => {}
setInterval(() => {
    let updated = false;
    canvasSizeDynamicUpdate.forEach(canvas => {
        if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            updated = true;
        }
    });

    if (updated) onCanvasSizesUpdate();
}, 750);

export class UserInterface {
    session: Session;
    element: HTMLDivElement;
    playlist: PlaylistInterface;
    plugins: PluginsInterface;
    clipEditor: ClipEditorInterface;
    explorer: ExplorerPane;

    constructor(session: Session) {
        this.session = session;
        this.playlist = new PlaylistInterface(this);
        this.plugins = new PluginsInterface(this);
        this.clipEditor = new ClipEditorInterface(this);

        tbWindowsProcess(session);
    }
    applyUpdate() {
        this.explorer = new ExplorerPane(this, this.element.querySelector("div.pane.explorer"));

        this.playlist.element = this.element.querySelector("div.pane.editor");
        this.playlist.applyUpdate();

        this.plugins.element = this.element.querySelector("div.pane.plugins");
        this.plugins.applyUpdate();

        this.clipEditor.element = this.element.querySelector("div.pane.clipeditor");
        this.clipEditor.applyUpdate();

        onCanvasSizesUpdate = () => {
            this.canvasRenderUpdate();
        };
    }

    updateNextFrame: boolean = false;
    canvasRenderUpdate() {
        this.updateNextFrame = true;
    }

    renderLoop() {
        if (this.session.playing || this.updateNextFrame || this.session.scrollFriction !== 0 || this.session.pxPerBeatTo !== this.session.pxPerBeat) {
            this.updateNextFrame = false;
            if (this.session.scrollFriction !== 0) {
                this.session.scrollFriction -= this.session.scrollFriction > 0? 1 : -1;
                this.session.scrolledPixels += this.session.scrollFriction;
                if (this.session.scrolledBeats < 0) {
                    this.session.scrollFriction = 0;
                    this.session.scrolledBeats = 0;
                }
            }
            if (this.session.pxPerBeatTo !== this.session.pxPerBeat) {
                this.session.pxPerBeat += (this.session.pxPerBeatTo - this.session.pxPerBeat) * 0.5;
            }

            this.playlist.timelineBar.render();
            this.session.playlist.tracks.forEach(track => {
                track.renderUpdate();
            });
            this.clipEditor.render();
            this.playlist.editorBar.timecode.textContent = msToString(beatsToMS(this.session.seeker, this.session.bpm) + (this.session.playing? this.session.playedLength : 0));
        }
    }

    get pluginsTray() {return this.element.classList.contains("pluginsopen");}
    set pluginsTray(val: boolean) {
        if (val) this.element.classList.add("pluginsopen");
        else this.element.classList.remove("pluginsopen");
    }

    get clipEditorTray() {return this.element.classList.contains("clipeditoropen");}
    set clipEditorTray(val: boolean) {
        if (val) this.element.classList.add("clipeditoropen");
        else this.element.classList.remove("clipeditoropen");
    }

    get dragMode() {return this.element.classList.contains("dragmode");}
    set dragMode(val: boolean) {
        if (val) this.element.classList.add("dragmode");
        else this.element.classList.remove("dragmode");
    }
}