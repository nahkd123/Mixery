export var ToolComponents;
(function (ToolComponents) {
    class Tool {
    }
    ToolComponents.Tool = Tool;
    let instanceOf;
    (function (instanceOf) {
        function PlaylistTool(obj) {
            return "playlistMouseDown" in obj || "playlistMouseMove" in obj || "playlistMouseUp" in obj;
        }
        instanceOf.PlaylistTool = PlaylistTool;
        function MIDIClipTool(obj) {
            return "midiClipEditorMouseDown" in obj || "midiClipEditorMouseMove" in obj || "midiClipEditorMouseUp" in obj;
        }
        instanceOf.MIDIClipTool = MIDIClipTool;
    })(instanceOf = ToolComponents.instanceOf || (ToolComponents.instanceOf = {}));
})(ToolComponents || (ToolComponents = {}));