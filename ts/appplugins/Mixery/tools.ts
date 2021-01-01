import { ToolComponents } from "../../mixeryapi/toolcomponent.js";
import { AudioClip, MIDIClip } from "../../mixerycore/clips.js";
import { MIDINoteInfo } from "../../mixerycore/midi.js";
import { Resources } from "../../mixerycore/resources.js";
import { msToBeats } from "../../utils/msbeats.js";
import { fixedSnap, snap } from "../../utils/snapper.js";

const EDGE_WIDTH = 12;

export class CursorTool extends ToolComponents.Tool implements ToolComponents.PlaylistTool, ToolComponents.MIDIClipTool {
    id = "cursor";
    name = "Cursor";
    description = "Seek/select clip/note";

    playlistMouseDown(event: ToolComponents.PlaylistToolEvent) {
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
    playlistMouseMove(event: ToolComponents.PlaylistToolEvent) {
        if (event.mouseDown) {
            event.playlist.session.seeker = fixedSnap(Math.max(0, event.beat), 0.125);
            event.playlist.ui.canvasRenderUpdate();
            return;
        }
    }
    playlistMouseUp(event: ToolComponents.PlaylistToolEvent) {}

    midiClipEditorMouseDown(event: ToolComponents.MIDIClipToolEvent) {}
    midiClipEditorMouseMove(event: ToolComponents.MIDIClipToolEvent) {}
    midiClipEditorMouseUp(event: ToolComponents.MIDIClipToolEvent) {}
}

export class PencilTool extends ToolComponents.Tool implements ToolComponents.PlaylistTool, ToolComponents.MIDIClipTool {
    id = "pencil";
    name = "Pencil";
    description = "Place/remove clips/notes (hold left/right click to place/remove clip constantly)";

    playlistMouseDown(event: ToolComponents.PlaylistToolEvent) {}
    playlistMouseMove(event: ToolComponents.PlaylistToolEvent) {
        if (event.mouseDown) {
            if (event.parent.buttons === 2 && event.clickedClip !== undefined) {
                event.clickedTrack.clips.splice(event.clickedTrack.clips.indexOf(event.clickedClip), 1);
                if (event.playlist.session.playlist.selectedClip === event.clickedClip) event.playlist.session.playlist.selectedClip = undefined;
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

            const duration =
                (event.playlist.session.resources.selectedResource !== undefined && event.playlist.session.resources.selectedResource instanceof Resources.MIDIResource)?
                Math.min(event.playlist.session.resources.selectedResource.actualLength, 1) :
                1;

            if (event.parent.buttons === 1 && !event.clickedTrack.isBlocked(event.beat, duration) && event.playlist.session.plugins.selected !== undefined) {
                const midi = 
                    (event.playlist.session.resources.selectedResource !== undefined && event.playlist.session.resources.selectedResource instanceof Resources.MIDIResource)?
                    event.playlist.session.resources.selectedResource :
                    event.playlist.session.resources.newMIDIResource();

                const clip = new MIDIClip(
                    midi,
                    event.playlist.session.plugins.selected.generator
                );
                clip.name = midi.name;
                clip.offset = snappedBeat;
                clip.length = duration;

                event.clickedTrack.clips.push(clip);
                event.playlist.session.playlist.selectedClip = clip;
            }
            event.playlist.ui.canvasRenderUpdate();
        }
    }
    playlistMouseUp(event: ToolComponents.PlaylistToolEvent) {}
    
    placeAndRemoveNote(event: ToolComponents.MIDIClipToolEvent) {
        const session = event.editor.session;

        if (event.parent.buttons === 1 && event.clickedNote === undefined && event.clip.getNoteAt(event.clickedNoteNo, event.beat + session.clipEditor.noteLength) === undefined) {
            const note: MIDINoteInfo = {
                note: event.clickedNoteNo,
                start: event.beat,
                duration: session.clipEditor.noteLength,
                sensitivity: 0.75
            };
            event.clip.notes.push(note);
            event.clip.notes.sort((a, b) => a.start - b.start);
            event.clip.midi.linkedElement.updateGraphics();
            session.ui.canvasRenderUpdate();
        } else if (event.parent.buttons === 2 && event.clickedNote !== undefined) {
            event.clip.notes.splice(event.clip.notes.indexOf(event.clickedNote), 1);
            event.clip.midi.linkedElement.updateGraphics();
            session.ui.canvasRenderUpdate();
        }
    }
    midiClipEditorMouseDown(event: ToolComponents.MIDIClipToolEvent) {this.placeAndRemoveNote(event);}
    midiClipEditorMouseMove(event: ToolComponents.MIDIClipToolEvent) {this.placeAndRemoveNote(event);}
    midiClipEditorMouseUp(event: ToolComponents.MIDIClipToolEvent) {}
}

export class MoveTool extends ToolComponents.Tool implements ToolComponents.PlaylistTool, ToolComponents.MIDIClipTool {
    id = "move";
    name = "Move";
    description = "Scroll or move/select/resize clip/note";

    selected = -1;
    oldBeat = 0;
    edge: "none" | "left" | "right" = "none";
    playlistMouseDown(event: ToolComponents.PlaylistToolEvent) {
        if (event.clickedClip !== undefined) {
            event.playlist.session.playlist.selectedClip = event.clickedClip;
            event.playlist.ui.clipEditor.selectedNotes = [];
            event.playlist.ui.canvasRenderUpdate();
            this.selected = event.clickedClip.offset - event.beat;

            const pxZoom = event.playlist.session.pxPerBeat;
            const clickedPixel = event.beat * pxZoom;
            const edgeLeftPixel = event.clickedClip.offset * pxZoom;
            const edgeRightPixel = (event.clickedClip.offset + event.clickedClip.length) * pxZoom - EDGE_WIDTH;

            if (clickedPixel >= edgeLeftPixel && clickedPixel <= edgeLeftPixel + EDGE_WIDTH) this.edge = "left";
            else if (clickedPixel >= edgeRightPixel && clickedPixel <= edgeRightPixel + EDGE_WIDTH) this.edge = "right";
            else this.edge = "none";
        }
    }
    playlistMouseMove(event: ToolComponents.PlaylistToolEvent) {
        if (event.mouseDown) {
            if (this.selected !== -1) {
                const clip = event.playlist.session.playlist.selectedClip;
                if (this.edge === "none") clip.offset = fixedSnap(event.beat + this.selected, 0.125);
                else if (this.edge === "left") {
                    const offset = clip.offset;
                    clip.offset = fixedSnap(event.beat + this.selected, 0.125);
                    clip.length += offset - clip.offset;
                } else if (this.edge === "right") clip.length = fixedSnap(event.beat - clip.offset, 0.125);
                event.playlist.ui.canvasRenderUpdate();
            } else {
                event.playlist.session.scrolledPixels = Math.max(event.playlist.session.scrolledPixels -event.parent.movementX, 0);
                this.oldBeat = event.beat;
                event.playlist.ui.canvasRenderUpdate();
            }
        }
    }
    playlistMouseUp(event: ToolComponents.PlaylistToolEvent) {
        if (this.selected === -1) {
            event.playlist.session.scrollFriction = Math.round(-(this.oldBeat - event.beat) * event.playlist.session.pxPerBeat);
        } else this.selected = -1;
    }
    
    oldNote = 0;
    oldNoteBeat = 0;
    oldParentEvent: MouseEvent;
    midiClipEditorMouseDown(event: ToolComponents.MIDIClipToolEvent) {
        const editor = event.editor;

        if (event.parent.buttons === 1 && event.clickedNote) {
            if (editor.selectedNotes.includes(event.clickedNote)) editor.selectedNotes.splice(editor.selectedNotes.indexOf(event.clickedNote), 1);
            else editor.selectedNotes.push(event.clickedNote);
        } else if (event.parent.buttons === 2) {
            editor.selectedNotes.forEach(note => {
                event.clip.notes.splice(event.clip.notes.indexOf(note), 1);
            });
            editor.selectedNotes = [];
            event.clip.midi.linkedElement.updateGraphics();
        }
        this.oldNote = event.clickedNoteNo;
        this.oldNoteBeat = event.beat;
        this.oldParentEvent = event.parent;
    }
    midiClipEditorMouseMove(event: ToolComponents.MIDIClipToolEvent) {
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
        } else if (event.parent.buttons === 1 && event.parent.ctrlKey) {
            const beatMove = event.beat - this.oldNoteBeat;
            this.oldNoteBeat = event.beat;

            editor.selectedNotes.forEach(note => {
                note.duration += beatMove;
                note.sensitivity = Math.max(Math.min(note.sensitivity - event.parent.movementY / 100, 1), 0);
            });
            editor.session.clipEditor.noteLength = editor.selectedNotes[0]?.duration || 0.125;
            event.clip.midi.linkedElement.updateGraphics();
        } else if (event.parent.buttons === 2) {
            editor.selectedNotes.forEach(note => {
                event.clip.notes.splice(event.clip.notes.indexOf(note), 1);
            });
            editor.selectedNotes = [];
            event.clip.midi.linkedElement.updateGraphics();
        }
        
        event.editor.ui.canvasRenderUpdate();
    }
    midiClipEditorMouseUp(event: ToolComponents.MIDIClipToolEvent) {
        if (this.oldParentEvent.pageX === event.parent.pageX && this.oldParentEvent.pageY === event.parent.pageY && event.clickedNote === undefined) {
            event.editor.selectedNotes = [];
            event.editor.ui.canvasRenderUpdate();
        }
    }
}