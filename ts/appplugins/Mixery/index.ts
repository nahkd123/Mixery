import { AppPlugins } from "../../mixeryapi/appplugins.js";

export let plugin: AppPlugins.PluginInfo = {
    name: "Mixery",
    authors: ["nahkd123"]
};

export function onLoad(plugin: AppPlugins.Plugin) {
    console.log(plugin);
}