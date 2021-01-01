import ContextMenu, { ContextMenuEntry } from "../../contextmenus/menu.js";
import { ToolComponents } from "../../mixeryapi/toolcomponent.js";
import { AutomationNode, AutomationNodeType } from "../../mixeryaudio/automations/automation.js";
import { AudioClip, AutomationClip, MIDIClip } from "../../mixerycore/clips.js";
import { MIDINoteInfo } from "../../mixerycore/midi.js";
import { NotesConfiguration, notesName } from "../../mixerycore/notes.js";
import { Session } from "../../mixerycore/session.js";
import { Tools } from "../../mixerycore/tools.js";
import drawAudioBuffer from "../../utils/audiobufferdraw.js";
import drawAutomation from "../../utils/automationdraw.js";
import { beatsToMS, msToBeats } from "../../utils/msbeats.js";
import { numberRounder } from "../../utils/numberround.js";
import { fixedSnap, fixedSnapCeil, snap } from "../../utils/snapper.js";
import { updateCanvasSize, UserInterface } from "../ui.js";

export class ClipEditorInterface {
    session: Session;
    ui: UserInterface;
    element: HTMLDivElement;

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    optionsButton: HTMLDivElement;
    midiClipOptions: ContextMenu = new ContextMenu();
    audioClipOptions: ContextMenu = new ContextMenu();

    static readonly SIDEBAR_WIDTH = 242;

    constructor(ui: UserInterface) {
        this.ui = ui;
        this.session = ui.session;
    }

    clickedAutomationNode: AutomationNode;
    applyUpdate() {
        this.canvas = this.element.querySelector("canvas");
        this.ctx = this.canvas.getContext("2d");

        this.optionsButton = this.element.querySelector("div.icon.options");
        this.optionsButton.addEventListener("click", event => {
            let element: HTMLDivElement;

            if (this.session.playlist.selectedClip instanceof MIDIClip) element = this.midiClipOptions.openMenu()?.element;
            else if (this.session.playlist.selectedClip instanceof AudioClip) element = this.audioClipOptions.openMenu()?.element;
            if (element === undefined) return;

            element.style.top = element.style.left = "";
            element.style.right = "15px";
            element.style.bottom = "40px";
        });

        this.midiClipOptions.entries.push(new ContextMenuEntry("Export to .MID"));

        this.audioClipOptions.entries.push(new ContextMenuEntry("Set to selected mixer track", () => {
            let clip = this.session.playlist.selectedClip;
            if (!(clip instanceof AudioClip)) return;
            clip.mixer = this.ui.mixer.mixerTracks.selected.track;
        }));

        this.canvas.addEventListener("wheel", event => {
            if (event.ctrlKey) {
                const oldMouseNote = (this.session.clipEditor.verticalScroll + this.mouse.y) / this.session.clipEditor.verticalZoom;

                this.session.clipEditor.verticalZoom -= event.deltaY / 25;
                this.session.clipEditor.verticalScroll = (oldMouseNote * this.session.clipEditor.verticalZoom) - this.mouse.y;
                if (this.session.clipEditor.verticalZoom < 5) this.session.clipEditor.verticalZoom = 5;
                if (this.session.clipEditor.verticalZoom > 350) this.session.clipEditor.verticalZoom = 350;
                
                event.preventDefault();
            } else this.session.clipEditor.verticalScroll += event.shiftKey? 0 : event.deltaY;
            this.session.scrolledPixels += event.shiftKey? event.deltaY : event.deltaX;
            if (this.session.scrolledPixels < 0) this.session.scrolledPixels = 0;
            this.ui.canvasRenderUpdate();
        });

        let clickDisabled = false;
        this.canvas.addEventListener("contextmenu", event => {
            event.preventDefault();
            this.ui.canvasRenderUpdate();
        });
        
        let oldOffset = -1;

        let automationNodeType: AutomationNodeType = "linearRamp";
        let automationMenu = new ContextMenu();
        automationMenu.entries.push(new ContextMenuEntry("Instant", () => {automationNodeType = "instant"}));
        automationMenu.entries.push(new ContextMenuEntry("Linear Ramp", () => {automationNodeType = "linearRamp"}));
        automationMenu.entries.push(new ContextMenuEntry("Exponential Ramp", () => {automationNodeType = "exponentialRamp"}));

        this.canvas.addEventListener("mousedown", event => {
            if (clickDisabled) return;
            
            this.mouse.down = true;
            this.mouse.x = event.offsetX;
            this.mouse.y = event.offsetY;
            this.mouse.dragStartX = event.offsetX;
            this.mouse.dragStartY = event.offsetY;

            if (this.mouse.x <= ClipEditorInterface.SIDEBAR_WIDTH) return;
            let selectedClip = this.session.playlist.selectedClip;
            const clickedBeat = snap((this.mouse.x - ClipEditorInterface.SIDEBAR_WIDTH + this.session.scrolledPixels) / this.session.pxPerBeat, ...this.session.clipEditor.availableLengths) - selectedClip.offset;
            const selectedTool = this.session.playlist.selectedTool;

            if (selectedClip instanceof MIDIClip) {
                if (clickedBeat < 0) return;
                const selectedTool = this.ui.selectedTool;
                if (!ToolComponents.instanceOf.MIDIClipTool(selectedTool)) return;

                const clickedNote = NotesConfiguration.NOTE_TO - Math.floor((this.mouse.y + this.session.clipEditor.verticalScroll) / this.session.clipEditor.verticalZoom);
                let toolCasted = <ToolComponents.MIDIClipTool> (<unknown> selectedTool);
                const eventObj: ToolComponents.MIDIClipToolEvent = {
                    parent: event,
                    beat: clickedBeat,
                    clickedNoteNo: clickedNote,
                    clip: selectedClip,
                    clickedNote: selectedClip.getNoteAt(clickedNote, clickedBeat),
                    editor: this
                };

                toolCasted.midiClipEditorMouseDown(eventObj);

            } else if (selectedClip instanceof AudioClip) {
                if (selectedTool === Tools.MOVE) {
                    oldOffset = selectedClip.audioOffset;
                }
            } else if (selectedClip instanceof AutomationClip) {
                const padding = 30;
                const paddedHeight = this.canvas.height - padding * 2;
                const rawClickedValue = 1 - Math.max(Math.min((event.offsetY - padding) / paddedHeight, 1.0), 0.0);
                const mappedClickedValue = rawClickedValue;

                this.clickedAutomationNode = undefined;

                function findNodeAt(location: number) {
                    const clip = selectedClip as AutomationClip;
                    for (let i = 0; i < clip.automation.nodes.length; i++) {
                        const node = clip.automation.nodes[i];
                        if (node.time === location) return node;
                    }
                }

                if (event.buttons === 4) {
                    automationMenu.openMenu(event.pageX, event.pageY);
                    event.preventDefault();
                    return;
                } else if (selectedTool === Tools.NOTHING) {
                    const node = findNodeAt(clickedBeat);
                    if (event.buttons === 1) {
                        if (node === undefined) {
                            this.clickedAutomationNode = selectedClip.automation.addNode(automationNodeType, clickedBeat, mappedClickedValue);
                        } else this.clickedAutomationNode = node;
                    } else if (event.buttons === 2) {
                        this.mouse.down = false;
                        selectedClip.automation.nodes.splice(selectedClip.automation.nodes.indexOf(node), 1);
                    }
                }
            }

            this.ui.canvasRenderUpdate();
        });
        this.canvas.addEventListener("mousemove", event => {
            this.mouse.x = event.offsetX;
            this.mouse.y = event.offsetY;

            if (this.mouse.down) {
                const selectedTool = this.session.playlist.selectedTool;
                let selectedClip = this.session.playlist.selectedClip;
                const clickedBeat = snap((this.mouse.x - ClipEditorInterface.SIDEBAR_WIDTH + this.session.scrolledPixels) / this.session.pxPerBeat, ...this.session.clipEditor.availableLengths) - selectedClip.offset;

                if (selectedClip instanceof MIDIClip) {
                    if (clickedBeat < 0) return;
                    const selectedTool = this.ui.selectedTool;
                    if (!ToolComponents.instanceOf.MIDIClipTool(selectedTool)) return;

                    const clickedNote = NotesConfiguration.NOTE_TO - Math.floor((this.mouse.y + this.session.clipEditor.verticalScroll) / this.session.clipEditor.verticalZoom);
                    let toolCasted = <ToolComponents.MIDIClipTool> (<unknown> selectedTool);
                    const eventObj: ToolComponents.MIDIClipToolEvent = {
                        parent: event,
                        beat: clickedBeat,
                        clickedNoteNo: clickedNote,
                        clip: selectedClip,
                        clickedNote: selectedClip.getNoteAt(clickedNote, clickedBeat),
                        editor: this
                    };

                    toolCasted.midiClipEditorMouseMove(eventObj);
                } else if (selectedClip instanceof AudioClip) {
                    if (selectedTool === Tools.MOVE) {
                        // selectedClip.audioOffset -= event.movementX / this.session.pxPerBeat;
                        if (oldOffset === -1) return;
                        selectedClip.audioOffset = Math.max(snap(oldOffset - (event.offsetX - this.mouse.dragStartX) / this.session.pxPerBeat, ...this.session.clipEditor.availableLengths), 0);
                    }
                } else if (selectedClip instanceof AutomationClip) {
                    if (selectedTool === Tools.NOTHING) {
                        const padding = 30;
                        const paddedHeight = this.canvas.height - padding * 2;
                        const rawClickedValue = 1 - Math.max(Math.min((event.offsetY - padding) / paddedHeight, 1.0), 0.0);
                        const mappedClickedValue = rawClickedValue;

                        if (this.clickedAutomationNode.time > 0) {
                            this.clickedAutomationNode.time = clickedBeat;
                        if (this.clickedAutomationNode.time <= 0) this.clickedAutomationNode.time = this.session.clipEditor.availableLengths[0];
                        }
                        this.clickedAutomationNode.value = event.shiftKey? mappedClickedValue : event.ctrlKey? fixedSnapCeil(mappedClickedValue, 0.05) : fixedSnap(mappedClickedValue, 0.05);
                    }
                }
            }

            this.ui.canvasRenderUpdate();
        });
        this.canvas.addEventListener("mouseup", event => {
            if (clickDisabled) return;

            if (this.mouse.down) {
                let selectedClip = this.session.playlist.selectedClip;
                const clickedBeat = snap((this.mouse.x - ClipEditorInterface.SIDEBAR_WIDTH + this.session.scrolledPixels) / this.session.pxPerBeat, ...this.session.clipEditor.availableLengths) - selectedClip.offset;

                if (selectedClip instanceof MIDIClip) {
                    if (clickedBeat < 0) return;
                    const selectedTool = this.ui.selectedTool;
                    if (!ToolComponents.instanceOf.MIDIClipTool(selectedTool)) return;

                    const clickedNote = NotesConfiguration.NOTE_TO - Math.floor((this.mouse.y + this.session.clipEditor.verticalScroll) / this.session.clipEditor.verticalZoom);
                    let toolCasted = <ToolComponents.MIDIClipTool> (<unknown> selectedTool);
                    const eventObj: ToolComponents.MIDIClipToolEvent = {
                        parent: event,
                        beat: clickedBeat,
                        clickedNoteNo: clickedNote,
                        clip: selectedClip,
                        clickedNote: selectedClip.getNoteAt(clickedNote, clickedBeat),
                        editor: this
                    };

                    toolCasted.midiClipEditorMouseUp(eventObj);
                } else if (selectedClip instanceof AutomationClip) {
                    selectedClip.automation.rearrange();
                    this.clickedAutomationNode = undefined;
                }

                oldOffset = -1;
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
        down: false,

        dragStartX: -1,
        dragStartY: -1
    };
    midiDrawInfo = {
        noteIndex: 0,
        noteStart: 0,
        noteEnd: 0
    };
    selectedNotes: MIDINoteInfo[] = [];

    drawLine(x1: number, y1: number, x2: number, y2: number) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.closePath();
    }
    drawVerticalLine(x: number, y1: number, y2: number) {
        if (x < ClipEditorInterface.SIDEBAR_WIDTH) return;
        this.drawLine(x, y1, x, y2);
    }
    drawHorizontalLine(x1: number, x2: number, y: number) {
        this.drawLine(x1, y, x2, y);
    }

    drawGrid(beatSegments = 4) {
        let ctx = this.ctx;
        const verticalLines = Math.floor(this.canvas.width / this.session.pxPerBeat) + 1;
        const lineOffset = this.session.scrolledPixels % this.session.pxPerBeat;

        for (let i = 0; i < verticalLines; i++) {
            const barSperator = Math.floor(i + this.session.scrolledBeats) % 4 === 0;
            const lineX = ClipEditorInterface.SIDEBAR_WIDTH - lineOffset + i * this.session.pxPerBeat;

            ctx.strokeStyle = barSperator? "#cecece30" : "#cecece10";
            ctx.lineWidth = barSperator? 4 : 2;
            this.drawVerticalLine(lineX, 0, this.canvas.height);
            if (barSperator) ctx.strokeStyle = "#cecece10";

            ctx.lineWidth = 1;
            for (let i = 1; i < beatSegments; i++) {
                this.drawVerticalLine(lineX + (i * this.session.pxPerBeat / beatSegments), 0, this.canvas.height);
            }
        }

        ctx.lineWidth = 2;
    }

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
        else if (selectedClip instanceof AudioClip) this.renderAudioClip(selectedClip);
        else if (selectedClip instanceof AutomationClip) this.renderAutomationClip(selectedClip);

        const resizerBeginX = ClipEditorInterface.SIDEBAR_WIDTH + ((selectedClip.offset - this.session.scrolledBeats) * this.session.pxPerBeat);
        const resizerEndX = resizerBeginX + (selectedClip.length * this.session.pxPerBeat);
        ctx.strokeStyle = selectedClip.bgcolor;
        ctx.lineWidth = 2;

        this.drawVerticalLine(resizerBeginX, 0, this.canvas.height);
        this.drawVerticalLine(resizerEndX, 0, this.canvas.height);

        this.drawGrid();

        //ctx.strokeStyle = "";
        if (this.session.playing) {
            const seekPxPlaying = (this.session.seeker - this.session.scrolledBeats + msToBeats(this.session.playedLength, this.session.bpm)) * this.session.pxPerBeat + ClipEditorInterface.SIDEBAR_WIDTH;
            ctx.strokeStyle = "rgb(252, 186, 3)";
            this.drawVerticalLine(seekPxPlaying, 0, this.canvas.height);
        }
    }

    renderHoveringBeat() {
        const hoveringBeat = snap((this.mouse.x - ClipEditorInterface.SIDEBAR_WIDTH + this.session.scrolledPixels) / this.session.pxPerBeat, ...this.session.clipEditor.availableLengths);
        this.ctx.strokeStyle = "#cecece10";
        this.ctx.beginPath();
        this.ctx.moveTo(hoveringBeat * this.session.pxPerBeat + ClipEditorInterface.SIDEBAR_WIDTH - this.session.scrolledPixels, 0);
        this.ctx.lineTo(hoveringBeat * this.session.pxPerBeat + ClipEditorInterface.SIDEBAR_WIDTH - this.session.scrolledPixels, this.canvas.height);
        this.ctx.stroke();
        this.ctx.closePath();
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
        ctx.fillStyle = clip.generator.noteNamesOverride? "#7a7a7a" : "white";
        ctx.fillRect(0, 0, ClipEditorInterface.SIDEBAR_WIDTH, this.canvas.height);
        const halfSidebarWidth = ClipEditorInterface.SIDEBAR_WIDTH / 2;

        for (let i = NotesConfiguration.NOTE_TO; i >= NotesConfiguration.NOTE_FROM; i--) {
            const drawY = (NotesConfiguration.NOTE_TO - i) * zoom - scroll;
            if (drawY + zoom < 0 || drawY > this.canvas.height) continue;
            const noteName = clip.generator.noteNamesOverride?.get(i)?.[0] || (notesName[i] + " (" + i + ")");
            // const octIndex = parseInt(noteName.replace(/([A-Z]|#)/g, ""));

            if (clip.generator.noteNamesOverride?.has(i)) {
                ctx.fillStyle = clip.generator.noteNamesOverride?.get(i)?.[1] || "white";
                ctx.fillRect(0, drawY, ClipEditorInterface.SIDEBAR_WIDTH, zoom);
            }
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

        this.renderHoveringBeat();
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

            ctx.globalAlpha = 1 - Math.min(Math.max(0, (ClipEditorInterface.SIDEBAR_WIDTH - drawX) / drawW), 1);

            // Draw note rect
            ctx.fillStyle = clip.bgcolor;
            ctx.fillRect(drawX, drawY, drawW, zoom);

            // Draw velocity indicator
            ctx.fillStyle = "black";
            ctx.fillRect(drawX + 3, drawY + zoom - 5, (drawW - 6) * note.sensitivity, 3);

            // Draw selected boundary
            if (this.selectedNotes.includes(note)) {
                ctx.strokeStyle = "rgb(255, 127, 0)";
                ctx.lineWidth = 2;
                ctx.strokeRect(drawX, drawY, drawW, zoom);
            }

            ctx.fillStyle = clip.fgcolor;
            ctx.fillText(notesName[note.note], drawX + 5, drawY + 16);
            ctx.globalAlpha = 1;
        });
    }

    renderAudioClip(clip: AudioClip) {
        const sidebarWidth = ClipEditorInterface.SIDEBAR_WIDTH;

        this.ctx.strokeStyle = clip.bgcolor;
        this.ctx.fillStyle = clip.bgcolor;

        if (clip.renderAudioClip) {
            this.ctx.lineJoin = "round";
            drawAudioBuffer(
                clip.cached, this.ctx,
                sidebarWidth + (clip.offset - this.session.scrolledBeats - clip.audioOffset) * this.session.pxPerBeat, 0,
                msToBeats(clip.buffer.duration * 1000, this.session.bpm) * this.session.pxPerBeat, this.canvas.height,
                beatsToMS(0, this.session.bpm), clip.buffer.duration * 1000,
                () => {
                    this.ctx.stroke();
                    this.ctx.fill();
                }, false
            );
        } else {
            this.ctx.fillText("Audio waveform rendering has been disabled due to performance drop", sidebarWidth + 15, 15);
        }

        // Draw the sidebar thing eee
        this.ctx.globalAlpha = 0.20;
        this.ctx.fillRect(0, 0, sidebarWidth, this.canvas.height);
        this.ctx.globalAlpha = 1;
        this.drawVerticalLine(sidebarWidth, 0, this.canvas.height);

        const channelHeight = this.canvas.height / clip.buffer.numberOfChannels;
        for (let i = 0; i < clip.buffer.numberOfChannels; i++) {
            if (i !== clip.buffer.numberOfChannels - 1) this.drawHorizontalLine(0, sidebarWidth, (i + 1) * channelHeight);
        }
    }

    renderAutomationClip(clip: AutomationClip) {
        const hoveringBeat = snap((this.mouse.x - ClipEditorInterface.SIDEBAR_WIDTH + this.session.scrolledPixels) / this.session.pxPerBeat, ...this.session.clipEditor.availableLengths);
        const sidebarWidth = ClipEditorInterface.SIDEBAR_WIDTH;
        const padding = 30;
        const rawClickedValue = 1 - Math.max(Math.min((this.mouse.y - padding) / (this.canvas.height - padding * 2), 1.0), 0.0);
        const mappedClickedValue = rawClickedValue;

        this.ctx.strokeStyle = clip.bgcolor;
        this.ctx.fillStyle = clip.bgcolor;

        drawAutomation(
            clip, this.ctx,
            sidebarWidth - (this.session.scrolledBeats - clip.offset) * this.session.pxPerBeat, padding,
            this.canvas.width - sidebarWidth, this.canvas.height - padding * 2,
            this.session.pxPerBeat, true, true
        );
        
        // The sidebar thing
        this.ctx.globalAlpha = 0.20;
        this.ctx.fillRect(0, 0, sidebarWidth, this.canvas.height);
        this.ctx.globalAlpha = 1;
        this.drawVerticalLine(sidebarWidth, 0, this.canvas.height);
        this.ctx.strokeStyle = "#cecece10";
        for (let i = clip.maxValue; i >= clip.minValue; i -= 0.25) {
            this.ctx.fillText(numberRounder(i, 2), 5, padding + (this.canvas.height - padding * 2) * (1 - i) + 3);
            this.drawHorizontalLine(0, this.canvas.width, padding + (this.canvas.height - padding * 2) * (1 - i));
        }

        this.renderHoveringBeat();
        // this.drawHorizontalLine(0, this.canvas.width, padding);
        // this.drawHorizontalLine(0, this.canvas.width, this.canvas.height - padding);
        this.drawHorizontalLine(0, this.canvas.width, padding + (this.canvas.height - padding * 2) * (1 - rawClickedValue));

        if (this.clickedAutomationNode) {
            this.ctx.fillStyle = clip.bgcolor;
            this.ctx.fillText("V = " + numberRounder(this.clickedAutomationNode.value, 2), (hoveringBeat - this.session.scrolledBeats) * this.session.pxPerBeat + sidebarWidth + 5, padding + (this.canvas.height - padding * 2) * (1 - rawClickedValue) + 5);
        }
    }
}