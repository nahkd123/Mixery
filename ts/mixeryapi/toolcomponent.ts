export namespace ToolComponents {
    export abstract class Tool {
        abstract name: string;
        abstract description: string;
    }

    export interface PlaylistTool {}
    export interface PlaylistToolEvent {
        mouseDown: boolean;
    }
    export interface MIDIClipTool {}
}