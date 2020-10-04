import { AudioGenerator, ExampleGenerator } from "../../mixerycore/generator.js";
import { Session } from "../../mixerycore/session.js";
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
        let entry = this.session.plugins.addPlugin(generator);

        let ele = document.createElement("div");
        ele.className = "pluginlistingentry selected";

        let label = document.createElement("div");
        label.className = "label";
        label.textContent = generator.name;

        ele.append(label);

        this.pluginsListing.insertBefore(ele, this.pluginsListing.lastChild.previousSibling);
        entry.element = ele;

        ele.addEventListener("click", event => {
            entry.selected = !entry.selected;
            this.session.plugins.selected = entry.selected? entry : undefined;
            this.session.plugins.updatePluginsInfo();
        });
    }
}