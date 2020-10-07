import { Session } from "./session.js";
import { AudioGenerator } from "./generator.js";

export class GeneratorsPlugins {
    session: Session;
    generators: GeneratorEntry[] = [];
    selected: GeneratorEntry;

    constructor(session: Session) {
        this.session = session;
    }

    addGenerator(generator: AudioGenerator) {
        this.selected = undefined;
        this.updatePluginsInfo();

        let entry = new GeneratorEntry(generator, this);
        this.generators.push(entry);
        this.selected = entry;

        generator.generatorLoad(this.session, generator.output);
        this.rerouteAudioNodes();
        return entry;
    }

    removeGenerator(generator: AudioGenerator) {
        if (this.selected !== undefined && this.selected.generator === generator) {
            this.generators.splice(this.generators.indexOf(this.selected), 1);
            this.selected = undefined;
            this.rerouteAudioNodes();
            return;
        }

        let entryIndex = this.findPluginIndex(generator);
        this.generators.splice(entryIndex, 1);
        this.rerouteAudioNodes();
    }

    findPluginIndex(generator: AudioGenerator) {
        for (let i = 0; i < this.generators.length; i++) {
            let entry = this.generators[i];
            if (entry.generator === generator) return i;
        }
        return -1;
    }

    updatePluginsInfo() {
        this.generators.forEach(plugin => {
            if (this.selected !== plugin && plugin.selected) plugin.selected = false;
        });
    }

    rerouteAudioNodes() {}
}

export class GeneratorEntry {
    mgr: GeneratorsPlugins;

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

    constructor(generator: AudioGenerator, mgr: GeneratorsPlugins) {
        this.generator = generator;
        this.mgr = mgr;
    }
}

export class PluginPreset {}