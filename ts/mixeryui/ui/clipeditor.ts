import { MIDIClip } from "../../mixerycore/clips.js";
import { NotesConfiguration, notesName } from "../../mixerycore/notes.js";
import { Session } from "../../mixerycore/session.js";
import { Tools } from "../../mixerycore/tools.js";
import { msToBeats } from "../../utils/msbeats.js";
import { fixedSnap, snap } from "../../utils/snapper.js";
import { updateCanvasSize, UserInterface } from "../ui.js";

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
                } else if (selectedTool === Tools.PENCIL) {
                    let selectedClip = this.session.playlist.selectedClip;
                    if (selectedClip instanceof MIDIClip) {
                        const clickedNote = NotesConfiguration.NOTE_TO - Math.floor((this.mouse.y + this.session.clipEditor.verticalScroll) / this.session.clipEditor.verticalZoom);
                        const start = fixedSnap(clickedBeat, this.session.clipEditor.noteLength) - selectedClip.offset;
                        const startEnd = start + this.session.clipEditor.noteLength;
                        
                        // Check if the ghost note is occupied by other notes
                        // ye I should have a better way to do this...
                        for (let i = 0; i < selectedClip.notes.length; i++) {
                            const note = selectedClip.notes[i];
                            if (note.note === clickedNote && (
                                (start >= note.start && start < note.start + note.duration) ||
                                (start <= note.start && startEnd > note.start)
                            )) {
                                if (event.buttons === 2) selectedClip.notes.splice(i, 1);
                                return;
                            };
                        }

                        if (event.buttons === 1) {
                            selectedClip.notes.push({
                                note: clickedNote,
                                sensitivity: 0.75,
                                start,
                                duration: this.session.clipEditor.noteLength
                            });
                            selectedClip.notes.sort((a, b) => (a.start - b.start));
                        }
                    }
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

        if (selectedClip instanceof MIDIClip) this.renderMIDIClip(selectedClip);

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
        function drawVerticalLine(x: number, y1: number, y2: number) {
            if (x < ClipEditorInterface.SIDEBAR_WIDTH) return;
            drawLine(x, y1, x, y2);
        }
        drawVerticalLine(resizerBeginX, 0, this.canvas.height);
        drawVerticalLine(resizerEndX, 0, this.canvas.height);

        //ctx.strokeStyle = "";
        if (this.session.playing) {
            const seekPxPlaying = (this.session.seeker - this.session.scrolledBeats + msToBeats(this.session.playedLength, this.session.bpm)) * this.session.pxPerBeat + ClipEditorInterface.SIDEBAR_WIDTH;
            ctx.strokeStyle = "rgb(252, 186, 3)";
            drawVerticalLine(seekPxPlaying, 0, this.canvas.height);
        }
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
            // const octIndex = parseInt(noteName.replace(/([A-Z]|#)/g, ""));

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

                ctx.fillStyle = "rgb(23, 19, 45)";
                ctx.fillRect(ClipEditorInterface.SIDEBAR_WIDTH, drawY, this.canvas.width - ClipEditorInterface.SIDEBAR_WIDTH, zoom);
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
            const drawX = fixedSnap(hoveringBeat, this.session.clipEditor.noteLength);
            ctx.fillRect(
                drawX * this.session.pxPerBeat + ClipEditorInterface.SIDEBAR_WIDTH - this.session.scrolledPixels,
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