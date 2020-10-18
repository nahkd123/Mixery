import ContextMenu, { ContextMenuEntry } from "../../contextmenus/menu.js";
import { AudioGenerator, ExampleGenerator } from "../../mixerycore/generator.js";
import { Session } from "../../mixerycore/session.js";
import { downloadJSON } from "../../utils/downloader.js";
import { UserInterface } from "../ui.js";

export class PluginsInterface {
    session: Session;
    ui: UserInterface;
    element: HTMLDivElement;

    pluginsListing: HTMLDivElement;

    constructor(ui: UserInterface) {
        this.ui = ui;
        this.session = ui.session;
    }

    applyUpdate() {
        this.pluginsListing = this.element.querySelector("div.sidebar.pluginslisting");

        (<HTMLDivElement> this.element.querySelector("div.pluginadd")).addEventListener("click", event => {
            this.addPlugin(new ExampleGenerator());
            // Later we'll add context menu that shows all available generators
        });
    }

    addPlugin(generator: AudioGenerator) {
        // generator.beforeLoad(this.session);
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
            // Open the window!
            if (generator.window !== undefined) {
                if (generator.window.hidden) generator.window.show();
                else generator.window.hide();
            }
        }

        let ctxmenu = new ContextMenu();
        ctxmenu.entries.push(new ContextMenuEntry("Show Plugin Interface", () => {showPluginInterface()}));
        ctxmenu.entries.push(new ContextMenuEntry("Remove Plugin", () => {
            this.session.plugins.removeGenerator(generator);
            ele.remove();
        }));
        ctxmenu.entries.push(new ContextMenuEntry("Export Plugin Preset", () => {
            downloadJSON(generator.getPluginPreset(), generator.name + ".json");
        }));

        let lastClickTime = 0;
        ele.addEventListener("click", event => {
            entry.selected = !entry.selected;
            this.session.plugins.selected = entry.selected? entry : undefined;
            this.session.midi.defaultKeysListener = entry.selected? generator : undefined;
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