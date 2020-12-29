import { CursorTool, MoveTool, PencilTool } from "./tools.js";
export let plugin = {
    name: "Mixery",
    authors: ["nahkd123"]
};
export function onLoad(plugin) {
    plugin.registerComponent(new CursorTool());
    plugin.registerComponent(new PencilTool());
    plugin.registerComponent(new MoveTool());
}