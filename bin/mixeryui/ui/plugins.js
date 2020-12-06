import ContextMenu, { ContextMenuEntry } from "../../contextmenus/menu.js";
import { MixeryFileFormat } from "../../fileformat/mixeryfile.js";
import { ExampleGenerator } from "../../mixerycore/generator.js";
import download from "../../utils/downloader.js";
export class PluginsInterface {
    constructor(ui) {
        this.ui = ui;
        this.session = ui.session;
    }
    applyUpdate() {
        this.pluginsListing = this.element.querySelector("div.sidebar.pluginslisting");
        this.element.querySelector("div.pluginadd").addEventListener("click", event => {
            this.addPlugin(new ExampleGenerator());
        });
    }
    addPlugin(generator) {
        let entry = this.session.plugins.addGenerator(generator);
        let ele = document.createElement("div");
        ele.className = "pluginlistingentry selected";
        let label = document.createElement("div");
        label.className = "label";
        label.textContent = generator.name;
        ele.append(label);
        this.pluginsListing.insertBefore(ele, this.pluginsListing.lastChild.previousSibling);
        entry.element = ele;
        function showPluginInterface() {
            if (generator.window !== undefined) {
                if (generator.window.hidden)
                    generator.window.show();
                else
                    generator.window.hide();
            }
        }
        let ctxmenu = new ContextMenu();
        ctxmenu.entries.push(new ContextMenuEntry("Show Plugin Interface", () => { showPluginInterface(); }));
        ctxmenu.entries.push(new ContextMenuEntry("Remove Plugin", () => {
            this.session.plugins.removeGenerator(generator);
            ele.remove();
        }));
        ctxmenu.entries.push(new ContextMenuEntry("Export Plugin Preset", async () => {
            let stream = await MixeryFileFormat.Generator.convertToGeneratorPresetFile(generator);
            let blob = stream.convertToBlob();
            download(blob, generator.displayName + ".mxypreset");
        }));
        let lastClickTime = 0;
        ele.addEventListener("click", event => {
            entry.selected = !entry.selected;
            this.session.plugins.selected = entry.selected ? entry : undefined;
            this.session.midi.defaultKeysListener = entry.selected ? generator : undefined;
            this.session.plugins.updatePluginsInfo();
            if (Date.now() - lastClickTime <= this.session.settings.accessibility.doubleClickSpeed) {
                showPluginInterface();
            }
            lastClickTime = Date.now();
        });
        ele.addEventListener("contextmenu", event => {
            event.preventDefault();
            ctxmenu.openMenu(event.pageX, event.pageY);
        });
    }
}