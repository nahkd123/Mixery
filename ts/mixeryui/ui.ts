import { Session } from "../mixerycore/session.js";
import { snap, BeatSnapPreset } from "../utils/snapper.js";
import { numberRounder, msToString } from "../utils/numberround.js";
import { Clip, MIDIClip } from "../mixerycore/clips.js";
import { ExampleGenerator, AudioGenerator } from "../mixerycore/generator.js";
import { Tools } from "../mixerycore/tools.js";
import { beatsToMS, msToBeats } from "../utils/msbeats.js";
import { ExplorerPane } from "./explorer.js";
import { NotesConfiguration, notesIndex, notesName } from "../mixerycore/notes.js";

let canvasSizeDynamicUpdate: HTMLCanvasElement[] = [];
function updateCanvasSize(canvas: HTMLCanvasElement) {
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

                function deleteClipAtCursor() {
                    globalCanvasMouseDown = false;
                    for (let i = 0; i < track.clips.length; i++) {
                        const clip = track.clips[i];
                        if (beginBeat >= clip.offset && clip.offset <= clip.offset + clip.length) {
                            track.clips.splice(i, 1);
                            if (this.session.playlist.selectedClip === clip) this.session.playlist.selectedClip = undefined;
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

        this.timelineBar.applyUpdate();
    }
}

export class PlaylistBar {
    ui: UserInterface;
    session: Session;
    element: HTMLDivElement;

    timecode: HTMLDivElement;
    tempo: HTMLDivElement;

    constructor(ui: UserInterface) {
        this.ui = ui;
        this.session = ui.session;
    }

    applyUpdate() {
        this.tempo = this.element.querySelector("div.editorbarentry.tempo div.value");
        this.timecode = this.element.querySelector("div.editorbarentry.time div.timecode");

        let mouseDown = false;
        let doubleBpm = 0;
        this.tempo.addEventListener("mousedown", event => {
            mouseDown = true;
            doubleBpm = this.session.bpm * 2;
            this.tempo.requestPointerLock();
        });
        this.tempo.addEventListener("mousemove", event => {
            if (mouseDown) {
                doubleBpm += event.movementX / 10;
                if (doubleBpm < 10) doubleBpm = 10;
                this.session.bpm = Math.floor(doubleBpm) / 2;
                this.tempo.textContent = numberRounder(this.session.bpm);
            }
        });
        this.tempo.addEventListener("mouseup", event => {
            mouseDown = false;
            document.exitPointerLock();
        });

        (<HTMLDivElement> this.element.querySelector("div.editorbarentry.plugins")).addEventListener("click", event => {
            this.ui.pluginsTray = !this.ui.pluginsTray;
        });
        (<HTMLDivElement> this.element.querySelector("div.editorbarentry.clipedit")).addEventListener("click", event => {
            this.ui.clipEditorTray = !this.ui.clipEditorTray;
        });

        let toolsButtons: HTMLDivElement[] = [];
        let toolsButtonsActions: Tools[] = [];
        function unselectTools(exclude?: HTMLDivElement) {
            toolsButtons.forEach(button => {if (button !== exclude) button.classList.remove("selected");});
        }
        function addToolButton(element: HTMLDivElement, tool: Tools) {
            toolsButtons.push(element);
            toolsButtonsActions.push(tool);
        }
        addToolButton(this.element.querySelector("div.tools.nothing"), Tools.NOTHING);
        addToolButton(this.element.querySelector("div.tools.pencil"), Tools.PENCIL);
        addToolButton(this.element.querySelector("div.tools.move"), Tools.MOVE);
        toolsButtons.forEach((button, index) => {
            button.addEventListener("click", event => {
                unselectTools(button);
                button.classList.add("selected");
                this.session.playlist.selectedTool = toolsButtonsActions[index];
            });
        });

        this.element.querySelector("div.playbackbutton.play").addEventListener("click", () => {
            this.session.playToggle();
            this.ui.canvasRenderUpdate();
        });
    }
}

export class TimelineBar {
    ui: UserInterface;
    session: Session;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(ui: UserInterface) {
        this.ui = ui;
        this.session = ui.session;
    }

    applyUpdate() {
        this.canvas.addEventListener("wheel", (event) => {
            if (event.ctrlKey) {
                this.session.pxPerBeatTo -= event.deltaY;
                if (this.session.pxPerBeatTo < 25) this.session.pxPerBeatTo = 25;
                if (this.session.pxPerBeatTo > this.canvas.offsetWidth - 100) this.session.pxPerBeatTo = this.canvas.offsetWidth - 100;
                event.preventDefault();
            } else {
                this.session.scrolledPixels += event.deltaY + event.deltaX;
                if (this.session.scrolledBeats < 0) this.session.scrolledBeats = 0;
            }
            // this.render();
            this.ui.canvasRenderUpdate();
        });

        let mouseDown = false;
        let seekBeat = 0;
        let move = false;
        this.canvas.addEventListener("mousedown", event => {
            mouseDown = true;
            this.canvas.requestPointerLock();
            seekBeat = this.session.seeker;
            move = false;
        });
        this.canvas.addEventListener("mousemove", event => {
            if (mouseDown) {
                move = move || (event.movementX !== 0 || event.movementY !== 0);

                seekBeat += event.movementX / this.session.pxPerBeat;
                if (seekBeat < 0) seekBeat = 0;
                this.session.seeker = snap(seekBeat, ...BeatSnapPreset);
                if (this.session.playing) this.session.stopAndThenPlay();

                // scroll?
                const seekerPos = this.session.seeker * this.session.pxPerBeat - this.session.scrolledPixels;
                if ((seekerPos >= this.canvas.offsetWidth - 100) || (seekerPos <= 100 && this.session.scrolledPixels > 0)) this.session.scrolledPixels += event.movementX;
                if (this.session.scrolledPixels < 0) this.session.scrolledPixels = 0;
                
                this.ui.canvasRenderUpdate();
            }
        });
        this.canvas.addEventListener("mouseup", event => {
            mouseDown = false;
            document.exitPointerLock();

            if (!move) {
                this.session.seeker = snap((event.offsetX / this.session.pxPerBeat) + this.session.scrolledBeats, ...BeatSnapPreset);
                this.ui.canvasRenderUpdate();
            }
        });
    }

    render() {
        // Canvas Render
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const visibleBeats = Math.floor(this.canvas.width / this.session.pxPerBeat) + 1;
        const scrolledBeats = Math.ceil(this.session.scrolledBeats);
        const drawStart = this.session.pxPerBeat - (Math.floor(this.session.scrolledBeats * this.session.pxPerBeat) % this.session.pxPerBeat || this.session.pxPerBeat);

        this.ctx.strokeStyle = "white";
        this.ctx.fillStyle = "white";
        this.ctx.font = "14px 'Nunito Sans', 'Noto Sans', 'Ubuntu', Calibri, sans-serif";
        this.ctx.beginPath();
        for (let i = 0; i < visibleBeats; i++) {
            this.ctx.moveTo(drawStart + i * this.session.pxPerBeat, ((scrolledBeats + i) % 4 === 0)? 29 : 34);
            this.ctx.lineTo(drawStart + i * this.session.pxPerBeat, 39);
            const text = (scrolledBeats + i + 1) + "";
            const charWidth = this.ctx.measureText(text).width;
            this.ctx.fillText(text, drawStart + i * this.session.pxPerBeat - charWidth / 2, 23);
        }
        this.ctx.stroke();
        this.ctx.closePath();

        function drawSeekerShape(ctx: CanvasRenderingContext2D, seekPx: number) {
            ctx.beginPath();
            ctx.moveTo(seekPx - 5, 0);
            ctx.lineTo(seekPx + 5, 0);
            ctx.lineTo(seekPx + 5, 10);
            ctx.lineTo(seekPx, 15);
            ctx.lineTo(seekPx - 5, 10);
            ctx.fill();
            ctx.closePath();
        }

        const seekPx = this.session.seeker * this.session.pxPerBeat - this.session.scrolledPixels;
        this.ctx.fillStyle = "rgb(86, 227, 198)";
        drawSeekerShape(this.ctx, seekPx);

        if (this.session.playing) {
            const seekPxPlaying = seekPx + msToBeats(this.session.playedLength, this.session.bpm) * this.session.pxPerBeat;
            this.ctx.fillStyle = "rgb(252, 186, 3)";
            drawSeekerShape(this.ctx, seekPxPlaying);
        }
    }
}

export class PluginsInterface {
    session: Session;
    ui: UserInterface;
    element: HTMLDivElement;

    pluginsListing: HTMLDivElement;

    constructor(ui: UserInterface) {
        this.ui = ui;
        this.session = ui.session;
    }

    applyUpdate() {
        this.pluginsListing = this.element.querySelector("div.sidebar.pluginslisting");

        (<HTMLDivElement> this.element.querySelector("div.pluginadd")).addEventListener("click", event => {
            this.addPlugin(new ExampleGenerator());
            // Later we'll add context menu that shows all available generators
        });
    }

    addPlugin(generator: AudioGenerator) {
        let entry = this.session.plugins.addPlugin(generator);

        let ele = document.createElement("div");
        ele.className = "pluginlistingentry selected";

        let label = document.createElement("div");
        label.className = "label";
        label.textContent = generator.name;

        ele.append(label);

        this.pluginsListing.insertBefore(ele, this.pluginsListing.lastChild.previousSibling);
        entry.element = ele;

        ele.addEventListener("click", event => {
            entry.selected = !entry.selected;
            this.session.plugins.selected = entry.selected? entry : undefined;
            this.session.plugins.updatePluginsInfo();
        });
    }
}

export class ClipEditorInterface {
    session: Session;
    ui: UserInterface;
    element: HTMLDivElement;

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    static readonly SIDEBAR_WIDTH = 242;

    constructor(ui: UserInterface) {
        this.ui = ui;
        this.session = ui.session;
    }

    applyUpdate() {
        this.canvas = this.element.querySelector("canvas");
        this.ctx = this.canvas.getContext("2d");

        this.canvas.addEventListener("wheel", event => {
            if (event.ctrlKey) {
                const oldMouseNote = (this.session.clipEditor.verticalScroll + this.mouse.y) / this.session.clipEditor.verticalZoom;

                this.session.clipEditor.verticalZoom -= event.deltaY / 25;
                this.session.clipEditor.verticalScroll = (oldMouseNote * this.session.clipEditor.verticalZoom) - this.mouse.y;
                if (this.session.clipEditor.verticalZoom < 5) this.session.clipEditor.verticalZoom = 5;
                if (this.session.clipEditor.verticalZoom > 350) this.session.clipEditor.verticalZoom = 350;
                
                event.preventDefault();
            } else this.session.clipEditor.verticalScroll += event.deltaY;
            this.session.scrolledPixels += event.deltaX;
            if (this.session.scrolledPixels < 0) this.session.scrolledPixels = 0;
            this.ui.canvasRenderUpdate();
        });

        let clickDisabled = false;
        this.canvas.addEventListener("contextmenu", event => {
            event.preventDefault();
            this.ui.canvasRenderUpdate();
        });
        
        this.canvas.addEventListener("mousedown", event => {
            if (clickDisabled) return;
            
            this.mouse.down = true;
            this.mouse.x = event.offsetX;
            this.mouse.y = event.offsetY;

            if (this.mouse.x <= ClipEditorInterface.SIDEBAR_WIDTH) return;
            let selectedClip = this.session.playlist.selectedClip;
            const clickedBeat = snap((this.mouse.x - ClipEditorInterface.SIDEBAR_WIDTH + this.session.scrolledPixels) / this.session.pxPerBeat, ...this.session.clipEditor.availableLengths);

            if (selectedClip instanceof MIDIClip) {
                const clickedNote = NotesConfiguration.NOTE_TO - Math.floor((this.mouse.y + this.session.clipEditor.verticalScroll) / this.session.clipEditor.verticalZoom);
                const selectedTool = this.session.playlist.selectedTool;

                if (selectedTool === Tools.NOTHING) {
                    if (event.button === 2) {
                        // Normal deleting
                        this.mouse.down = false;
                        for (let i = 0; i < selectedClip.notes.length; i++) {
                            const note = selectedClip.notes[i];
                            if (note.note === clickedNote && clickedBeat >= selectedClip.offset + note.start && clickedBeat <= selectedClip.offset + note.start + note.duration) {
                                selectedClip.notes.splice(i, 1);
                                break;
                            }
                        }
                    } else {
                        // Normal placing
                        this.midiDrawInfo.noteIndex = clickedNote;
                        this.midiDrawInfo.noteStart = clickedBeat;
                        this.midiDrawInfo.noteEnd = clickedBeat;
                    }
                } else if (selectedTool === Tools.PENCIL) {
                    // Freedraw
                }
            }

            this.ui.canvasRenderUpdate();
        });
        this.canvas.addEventListener("mousemove", event => {
            this.mouse.x = event.offsetX;
            this.mouse.y = event.offsetY;

            if (this.mouse.down) {
                const selectedTool = this.session.playlist.selectedTool;
                const clickedBeat = snap((this.mouse.x - ClipEditorInterface.SIDEBAR_WIDTH + this.session.scrolledPixels) / this.session.pxPerBeat, ...this.session.clipEditor.availableLengths);

                if (selectedTool === Tools.NOTHING) {
                    this.midiDrawInfo.noteEnd = clickedBeat;
                }
            }

            this.ui.canvasRenderUpdate();
        });
        this.canvas.addEventListener("mouseup", event => {
            if (clickDisabled) return;

            if (this.mouse.down) {
                let selectedClip = this.session.playlist.selectedClip;
                const selectedTool = this.session.playlist.selectedTool;
                const clickedBeat = snap((this.mouse.x - ClipEditorInterface.SIDEBAR_WIDTH + this.session.scrolledPixels) / this.session.pxPerBeat, ...this.session.clipEditor.availableLengths);

                if (selectedClip instanceof MIDIClip) {
                    if (selectedTool === Tools.NOTHING) {
                        if (clickedBeat - this.midiDrawInfo.noteStart <= 0) return;
                        
                        selectedClip.notes.push({
                            note: this.midiDrawInfo.noteIndex,
                            sensitivity: 0.75,
                            start: this.midiDrawInfo.noteStart - selectedClip.offset,
                            duration: clickedBeat - this.midiDrawInfo.noteStart
                        });
                        // console.log(selectedClip.notes);
                        selectedClip.notes.sort((a, b) => (a.start - b.start))
                    }
                }
            }

            this.mouse.down = false;
            this.ui.canvasRenderUpdate();
        });

        updateCanvasSize(this.canvas);
        this.render();
    }

    mouse = {
        x: -1,
        y: -1,
        down: false
    };
    midiDrawInfo = {
        noteIndex: 0,
        noteStart: 0,
        noteEnd: 0
    };

    render() {
        if (this.session.clipEditor.verticalScroll < 0) this.session.clipEditor.verticalScroll = 0;
        if (this.canvas.width !== this.canvas.offsetWidth || this.canvas.height !== this.canvas.offsetHeight) {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        }

        let ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = "12px 'Nunito Sans', 'Noto Sans', 'Ubuntu', Calibri, sans-serif";

        if (this.session.playlist.selectedClip === undefined) {
            ctx.fillStyle = "white";
            ctx.fillText("No Clip Selected", ClipEditorInterface.SIDEBAR_WIDTH, 16);
            return;
        }

        let selectedClip = this.session.playlist.selectedClip;

        const resizerBeginX = ClipEditorInterface.SIDEBAR_WIDTH + ((selectedClip.offset - this.session.scrolledBeats) * this.session.pxPerBeat);
        const resizerEndX = resizerBeginX + (selectedClip.length * this.session.pxPerBeat);
        ctx.strokeStyle = selectedClip.bgcolor;
        ctx.lineWidth = 2;

        function drawLine(x1: number, y1: number, x2: number, y2: number) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.closePath();
        }
        drawLine(resizerBeginX, 0, resizerBeginX, this.canvas.height);
        drawLine(resizerEndX, 0, resizerEndX, this.canvas.height);

        //ctx.strokeStyle = "";
        if (this.session.playing) {
            const seekPxPlaying = (this.session.seeker - this.session.scrolledBeats + msToBeats(this.session.playedLength, this.session.bpm)) * this.session.pxPerBeat + ClipEditorInterface.SIDEBAR_WIDTH;
            ctx.strokeStyle = "rgb(252, 186, 3)";
            drawLine(seekPxPlaying, 0, seekPxPlaying, this.canvas.height);
        }

        if (selectedClip instanceof MIDIClip) this.renderMIDIClip(selectedClip);
    }

    renderMIDIClip(clip: MIDIClip) {
        const allNotesHeight = this.session.clipEditor.verticalZoom * (NotesConfiguration.NOTE_TO - NotesConfiguration.NOTE_FROM + 1) - this.canvas.height;
        if (this.session.clipEditor.verticalScroll > allNotesHeight) this.session.clipEditor.verticalScroll = allNotesHeight;

        let ctx = this.ctx;
        let scroll = this.session.clipEditor.verticalScroll;
        let zoom = this.session.clipEditor.verticalZoom;

        const hoveringNote = NotesConfiguration.NOTE_TO - Math.floor((this.mouse.y + scroll) / zoom);
        const hoveringBeat = snap((this.mouse.x - ClipEditorInterface.SIDEBAR_WIDTH + this.session.scrolledPixels) / this.session.pxPerBeat, ...this.session.clipEditor.availableLengths);

        // MIDI Sidebar
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, ClipEditorInterface.SIDEBAR_WIDTH, this.canvas.height);
        const halfSidebarWidth = ClipEditorInterface.SIDEBAR_WIDTH / 2;

        for (let i = NotesConfiguration.NOTE_TO; i >= NotesConfiguration.NOTE_FROM; i--) {
            const drawY = (NotesConfiguration.NOTE_TO - i) * zoom - scroll;
            if (drawY + zoom < 0 || drawY > this.canvas.height) continue;
            const noteName = notesName[i] + " (" + i + ")";

            if (noteName.includes("#")) {
                if (hoveringNote === i) {
                    ctx.fillStyle = "#2c2c2c";
                    ctx.fillRect(0, drawY, halfSidebarWidth, zoom);
                    ctx.fillStyle = "#cecece";
                    ctx.fillRect(halfSidebarWidth, drawY, halfSidebarWidth, zoom);
                } else {
                    ctx.fillStyle = "black";
                    ctx.fillRect(0, drawY, halfSidebarWidth, zoom);
                }
            } else if (hoveringNote === i) {
                ctx.fillStyle = "#cecece";
                ctx.fillRect(0, drawY, ClipEditorInterface.SIDEBAR_WIDTH, zoom);
            }

            ctx.fillStyle = noteName.includes("#")? "white" : "black";
            ctx.fillText(noteName, 5, drawY + 16);

            if (hoveringNote === i) {
                ctx.fillStyle = "#cecece10";
                ctx.fillRect(ClipEditorInterface.SIDEBAR_WIDTH, drawY, this.canvas.width - ClipEditorInterface.SIDEBAR_WIDTH, zoom);
            }
        }

        // Render hovering beat thing
        ctx.strokeStyle = "#cecece10";
        ctx.beginPath();
        ctx.moveTo(hoveringBeat * this.session.pxPerBeat + ClipEditorInterface.SIDEBAR_WIDTH - this.session.scrolledPixels, 0);
        ctx.lineTo(hoveringBeat * this.session.pxPerBeat + ClipEditorInterface.SIDEBAR_WIDTH - this.session.scrolledPixels, this.canvas.height);
        ctx.stroke();
        ctx.closePath();
        if (this.session.playlist.selectedTool === Tools.NOTHING && this.mouse.down) {
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = clip.bgcolor;
            ctx.fillRect(
                this.midiDrawInfo.noteStart * this.session.pxPerBeat + ClipEditorInterface.SIDEBAR_WIDTH - this.session.scrolledPixels,
                (NotesConfiguration.NOTE_TO - this.midiDrawInfo.noteIndex) * zoom - scroll,
                (this.midiDrawInfo.noteEnd - this.midiDrawInfo.noteStart) * this.session.pxPerBeat,
                zoom
            );
            ctx.globalAlpha = 1;
        } else if (this.session.playlist.selectedTool === Tools.PENCIL) {
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = clip.bgcolor;
            ctx.fillRect(
                hoveringBeat * this.session.pxPerBeat + ClipEditorInterface.SIDEBAR_WIDTH - this.session.scrolledPixels,
                (NotesConfiguration.NOTE_TO - hoveringNote) * zoom - scroll,
                this.session.clipEditor.noteLength * this.session.pxPerBeat,
                zoom
            );
            ctx.globalAlpha = 1;
        }

        // Render notes
        clip.notes.forEach(note => {
            const drawX = (clip.offset + note.start - this.session.scrolledBeats) * this.session.pxPerBeat + ClipEditorInterface.SIDEBAR_WIDTH;
            const drawY = (NotesConfiguration.NOTE_TO - note.note) * zoom - scroll;
            const drawW = note.duration * this.session.pxPerBeat;
            
            if (drawX + drawW - ClipEditorInterface.SIDEBAR_WIDTH < 0) return;

            ctx.fillStyle = clip.bgcolor;
            ctx.fillRect(drawX, drawY, drawW, zoom);

            ctx.fillStyle = clip.fgcolor;
            ctx.fillText(notesName[note.note], drawX + 5, drawY + 16);
        });
    }
}

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
    }
    applyUpdate() {
        this.playlist.element = this.element.querySelector("div.pane.editor");
        this.playlist.applyUpdate();

        this.plugins.element = this.element.querySelector("div.pane.plugins");
        this.plugins.applyUpdate();

        this.clipEditor.element = this.element.querySelector("div.pane.clipeditor");
        this.clipEditor.applyUpdate();

        this.explorer = new ExplorerPane(this, this.element.querySelector("div.pane.explorer"));

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