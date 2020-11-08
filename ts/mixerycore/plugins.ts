import { Session } from "./session.js";
import { AudioGenerator } from "./generator.js";
import { GeneratorExplorerContent } from "../mixeryui/explorer.js";

export class PluginsManager {
    generators: GeneratorExplorerContent[] = [];

    /**
     * The mapped plugins thing. The top-level map key is the primary author's name, and the second-level
     * map key is the plugin name.
     */
    mapped: Map<string, {
        generators: Map<string, GeneratorExplorerContent>
    }> = new Map();

    constructor() {}
    addEffect(generator: GeneratorExplorerContent) {
        this.generators.push(generator);
        let obj: {
            generators: Map<string, GeneratorExplorerContent>
        };
        if (!this.mapped.has(generator.author[0] || "unknown author")) this.mapped.set(generator.author[0] || "unknown author", obj = {
            generators: new Map()
        });
        else obj = this.mapped.get(generator.author[0] || "unknown author");

        obj.generators.set(generator.name, generator);
    }
}

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
        this.session.midi.defaultKeysListener = generator;

        generator.generatorLoad(this.session, generator.output);
        this.rerouteAudioNodes();
        return entry;
    }

    removeGenerator(generator: AudioGenerator) {
        if (this.selected !== undefined && this.selected.generator === generator) {
            this.generators.splice(this.generators.indexOf(this.selected), 1);
            this.selected = undefined;
            this.session.midi.defaultKeysListener = undefined;
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
        this.mgr.session.midi.defaultKeysListener = this.generator;
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