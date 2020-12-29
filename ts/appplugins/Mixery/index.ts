import { AppPlugins } from "../../mixeryapi/appplugins.js";
import { CursorTool, MoveTool, PencilTool } from "./tools.js";

export let plugin: AppPlugins.PluginInfo = {
    name: "Mixery",
    authors: ["nahkd123"]
};

export function onLoad(plugin: AppPlugins.Plugin) {
    plugin.registerComponent(new CursorTool());
    plugin.registerComponent(new PencilTool());
    plugin.registerComponent(new MoveTool());
}