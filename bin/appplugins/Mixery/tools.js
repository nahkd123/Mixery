import { ToolComponents } from "../../mixeryapi/toolcomponent.js";
import { AudioClip, MIDIClip } from "../../mixerycore/clips.js";
import { Resources } from "../../mixerycore/resources.js";
import { msToBeats } from "../../utils/msbeats.js";
import { fixedSnap } from "../../utils/snapper.js";
const EDGE_WIDTH = 12;
export class CursorTool extends ToolComponents.Tool {
    constructor() {
        super(...arguments);
        this.id = "cursor";
        this.name = "Cursor";
        this.description = "Seek/select clip/note";
    }
    playlistMouseDown(event) {
        if (event.clickedClip === undefined) {
            event.playlist.session.seeker = fixedSnap(Math.max(0, event.beat), 0.125);
            event.playlist.session.playlist.selectedClip = undefined;
            event.playlist.ui.clipEditor.selectedNotes = [];
            event.playlist.ui.canvasRenderUpdate();
            return;
        }
        const clip = event.clickedClip;
        event.playlist.session.playlist.selectedClip = clip;
        event.playlist.ui.canvasRenderUpdate();
    }
    playlistMouseMove(event) {
        if (event.mouseDown) {
            event.playlist.session.seeker = fixedSnap(Math.max(0, event.beat), 0.125);
            event.playlist.ui.canvasRenderUpdate();
            return;
        }
    }
    playlistMouseUp(event) { }
    midiClipEditorMouseDown(event) { }
    midiClipEditorMouseMove(event) { }
    midiClipEditorMouseUp(event) { }
}
export class PencilTool extends ToolComponents.Tool {
    constructor() {
        super(...arguments);
        this.id = "pencil";
        this.name = "Pencil";
        this.description = "Place/remove clips/notes (hold left/right click to place/remove clip constantly)";
    }
    playlistMouseDown(event) { }
    playlistMouseMove(event) {
        if (event.mouseDown) {
            if (event.parent.buttons === 2 && event.clickedClip !== undefined) {
                event.clickedTrack.clips.splice(event.clickedTrack.clips.indexOf(event.clickedClip), 1);
                if (event.playlist.session.playlist.selectedClip === event.clickedClip)
                    event.playlist.session.playlist.selectedClip = undefined;
                event.playlist.ui.canvasRenderUpdate();
                return;
            }
            const snappedBeat = fixedSnap(event.beat, 0.125);
            if (event.parent.buttons === 1 && event.playlist.session.resources.selectedResource !== undefined && event.playlist.session.resources.selectedResource instanceof Resources.AudioResource) {
                const audio = event.playlist.session.resources.selectedResource;
                const beats = msToBeats(audio.decoded.duration * 1000, event.playlist.session.bpm);
                const mixer = event.playlist.ui.mixer.mixerTracks.selected.track;
                if (!event.clickedTrack.isBlocked(event.beat, beats)) {
                    const clip = new AudioClip(audio, mixer);
                    clip.name = audio.name;
                    clip.offset = snappedBeat;
                    clip.length = beats;
                    event.clickedTrack.clips.push(clip);
                    event.playlist.session.playlist.selectedClip = clip;
                }
            }
            const duration = (event.playlist.session.resources.selectedResource !== undefined && event.playlist.session.resources.selectedResource instanceof Resources.MIDIResource) ?
                Math.min(event.playlist.session.resources.selectedResource.actualLength, 1) :
                1;
            if (event.parent.buttons === 1 && !event.clickedTrack.isBlocked(event.beat, duration) && event.playlist.session.plugins.selected !== undefined) {
                const midi = (event.playlist.session.resources.selectedResource !== undefined && event.playlist.session.resources.selectedResource instanceof Resources.MIDIResource) ?
                    event.playlist.session.resources.selectedResource :
                    event.playlist.session.resources.newMIDIResource();
                const clip = new MIDIClip(midi, event.playlist.session.plugins.selected.generator);
                clip.name = midi.name;
                clip.offset = snappedBeat;
                clip.length = duration;
                event.clickedTrack.clips.push(clip);
                event.playlist.session.playlist.selectedClip = clip;
            }
            event.playlist.ui.canvasRenderUpdate();
        }
    }
    playlistMouseUp(event) { }
    placeAndRemoveNote(event) {
        const session = event.editor.session;
        if (event.parent.buttons === 1 && event.clickedNote === undefined && event.clip.getNoteAt(event.clickedNoteNo, event.beat + session.clipEditor.noteLength) === undefined) {
            const note = {
                note: event.clickedNoteNo,
                start: event.beat,
                duration: session.clipEditor.noteLength,
                sensitivity: 0.75
            };
            event.clip.notes.push(note);
            event.clip.notes.sort((a, b) => a.start - b.start);
            event.clip.midi.linkedElement.updateGraphics();
            session.ui.canvasRenderUpdate();
        }
        else if (event.parent.buttons === 2 && event.clickedNote !== undefined) {
            event.clip.notes.splice(event.clip.notes.indexOf(event.clickedNote), 1);
            event.clip.midi.linkedElement.updateGraphics();
            session.ui.canvasRenderUpdate();
        }
    }
    midiClipEditorMouseDown(event) { this.placeAndRemoveNote(event); }
    midiClipEditorMouseMove(event) { this.placeAndRemoveNote(event); }
    midiClipEditorMouseUp(event) { }
}
export class MoveTool extends ToolComponents.Tool {
    constructor() {
        super(...arguments);
        this.id = "move";
        this.name = "Move";
        this.description = "Scroll or move/select/resize clip/note";
        this.selected = -1;
        this.oldBeat = 0;
        this.edge = "none";
        this.oldNote = 0;
        this.oldNoteBeat = 0;
    }
    playlistMouseDown(event) {
        if (event.clickedClip !== undefined) {
            event.playlist.session.playlist.selectedClip = event.clickedClip;
            event.playlist.ui.clipEditor.selectedNotes = [];
            event.playlist.ui.canvasRenderUpdate();
            this.selected = event.clickedClip.offset - event.beat;
            const pxZoom = event.playlist.session.pxPerBeat;
            const clickedPixel = event.beat * pxZoom;
            const edgeLeftPixel = event.clickedClip.offset * pxZoom;
            const edgeRightPixel = (event.clickedClip.offset + event.clickedClip.length) * pxZoom - EDGE_WIDTH;
            if (clickedPixel >= edgeLeftPixel && clickedPixel <= edgeLeftPixel + EDGE_WIDTH)
                this.edge = "left";
            else if (clickedPixel >= edgeRightPixel && clickedPixel <= edgeRightPixel + EDGE_WIDTH)
                this.edge = "right";
            else
                this.edge = "none";
        }
    }
    playlistMouseMove(event) {
        if (event.mouseDown) {
            if (this.selected !== -1) {
                const clip = event.playlist.session.playlist.selectedClip;
                if (this.edge === "none")
                    clip.offset = fixedSnap(event.beat + this.selected, 0.125);
                else if (this.edge === "left") {
                    const offset = clip.offset;
                    clip.offset = fixedSnap(event.beat + this.selected, 0.125);
                    clip.length += offset - clip.offset;
                }
                else if (this.edge === "right")
                    clip.length = fixedSnap(event.beat - clip.offset, 0.125);
                event.playlist.ui.canvasRenderUpdate();
            }
            else {
                event.playlist.session.scrolledPixels = Math.max(event.playlist.session.scrolledPixels - event.parent.movementX, 0);
                this.oldBeat = event.beat;
                event.playlist.ui.canvasRenderUpdate();
            }
        }
    }
    playlistMouseUp(event) {
        if (this.selected === -1) {
            event.playlist.session.scrollFriction = Math.round(-(this.oldBeat - event.beat) * event.playlist.session.pxPerBeat);
        }
        else
            this.selected = -1;
    }
    midiClipEditorMouseDown(event) {
        if (event.clickedNote) {
            if (event.editor.selectedNotes.includes(event.clickedNote))
                event.editor.selectedNotes.splice(event.editor.selectedNotes.indexOf(event.clickedNote), 1);
            else
                event.editor.selectedNotes.push(event.clickedNote);
        }
        this.oldNote = event.clickedNoteNo;
        this.oldNoteBeat = event.beat;
    }
    midiClipEditorMouseMove(event) {
        const editor = event.editor;
        if (event.parent.buttons === 1 && !event.parent.ctrlKey) {
            const noteMove = event.clickedNoteNo - this.oldNote;
            this.oldNote = event.clickedNoteNo;
            const beatMove = event.beat - this.oldNoteBeat;
            this.oldNoteBeat = event.beat;
            editor.selectedNotes.forEach(note => {
                note.note += noteMove;
                note.start += beatMove;
            });
            event.clip.notes.sort((a, b) => a.start - b.start);
            event.clip.midi.linkedElement.updateGraphics();
        }
        else if (event.parent.buttons === 1 && event.parent.ctrlKey) {
            const beatMove = event.beat - this.oldNoteBeat;
            this.oldNoteBeat = event.beat;
            editor.selectedNotes.forEach(note => {
                note.duration += beatMove;
            });
            editor.session.clipEditor.noteLength = editor.selectedNotes[0]?.duration || 0.125;
            event.clip.midi.linkedElement.updateGraphics();
        }
        else if (event.parent.buttons === 2) {
            editor.selectedNotes.forEach(note => {
                event.clip.notes.splice(event.clip.notes.indexOf(note), 1);
            });
            editor.selectedNotes = [];
            event.clip.midi.linkedElement.updateGraphics();
        }
        event.editor.ui.canvasRenderUpdate();
    }
    midiClipEditorMouseUp(event) { }
}