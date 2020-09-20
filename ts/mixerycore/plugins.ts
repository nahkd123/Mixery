import { Session } from "./session.js";
import { AudioGenerator } from "./generator.js";

export class Plugins {
    session: Session;
    plugins: PluginEntry[] = [];
    selected: PluginEntry;

    constructor(session: Session) {
        this.session = session;
    }

    addPlugin(generator: AudioGenerator) {
        this.selected = undefined;
        this.updatePluginsInfo();

        let entry = new PluginEntry(generator, this);
        this.plugins.push(entry);
        this.selected = entry;

        generator.generatorLoad(this.session, null);
        return entry;
    }

    updatePluginsInfo() {
        this.plugins.forEach(plugin => {
            if (this.selected !== plugin && plugin.selected) plugin.selected = false;
        });
    }
}

export class PluginEntry {
    mgr: Plugins;

    _selected: boolean = true;
    generator: AudioGenerator;
    get name() {return this.generator.name;}

    element: HTMLDivElement;
    get selected() {return this._selected;}
    set selected(val: boolean) {
        this._selected = val;
        if (val) {
            this.element.classList.add("selected");
        } else {
            this.element.classList.remove("selected");
        }
    }

    constructor(generator: AudioGenerator, mgr: Plugins) {
        this.generator = generator;
        this.mgr = mgr;
    }
}

export class PluginPreset {}