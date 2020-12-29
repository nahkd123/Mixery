import { Clip, MIDIClip } from "../mixerycore/clips.js";
import { MIDINoteInfo } from "../mixerycore/midi.js";
import { PlaylistTrack } from "../mixerycore/playlist.js";
import { ClipEditorInterface } from "../mixeryui/ui/clipeditor.js";
import { PlaylistInterface } from "../mixeryui/ui/playlist.js";

export namespace ToolComponents {
    export abstract class Tool {
        abstract id: string;
        abstract name: string;
        abstract description: string;
    }

    export interface PlaylistTool {
        playlistMouseDown(event: PlaylistToolEvent);
        playlistMouseMove(event: PlaylistToolEvent);
        playlistMouseUp(event: PlaylistToolEvent);
    }
    export interface PlaylistToolEvent {
        /** Parent mouse event */
        parent: MouseEvent;

        /** The playlist interface */
        playlist: PlaylistInterface;

        /** true if the user is currently holding mouse button */
        mouseDown: boolean;

        /** Computed beat index (float number) */
        beat: number;

        //#region Additional stuffs
        clickedClip?: Clip;
        clickedTrack: PlaylistTrack;
        //#endregion
    }

    export interface MIDIClipTool {
        midiClipEditorMouseDown(event: MIDIClipToolEvent);
        midiClipEditorMouseMove(event: MIDIClipToolEvent);
        midiClipEditorMouseUp(event: MIDIClipToolEvent);
    }
    export interface MIDIClipToolEvent {
        parent: MouseEvent;
        clip: MIDIClip;

        clickedNote?: MIDINoteInfo;
        clickedNoteNo: number;
        beat: number;

        editor: ClipEditorInterface;
    }

    export namespace instanceOf {
        export function PlaylistTool(obj: Tool) {
            return "playlistMouseDown" in obj || "playlistMouseMove" in obj || "playlistMouseUp" in obj;
        }
        export function MIDIClipTool(obj: Tool) {
            return "midiClipEditorMouseDown" in obj || "midiClipEditorMouseMove" in obj || "midiClipEditorMouseUp" in obj;
        }
    }
}