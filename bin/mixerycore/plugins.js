export class PluginsManager {
    constructor() {
        this.generators = [];
        /**
         * The mapped plugins thing. The top-level map key is the primary author's name, and the second-level
         * map key is the plugin name.
         */
        this.mapped = new Map();
    }
    addEffect(generator) {
        this.generators.push(generator);
        let obj;
        if (!this.mapped.has(generator.author[0] || "unknown author"))
            this.mapped.set(generator.author[0] || "unknown author", obj = {
                generators: new Map()
            });
        else
            obj = this.mapped.get(generator.author[0] || "unknown author");
        obj.generators.set(generator.name, generator);
    }
}
export class GeneratorsPlugins {
    constructor(session) {
        this.generators = [];
        this.session = session;
    }
    addGenerator(generator) {
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
    removeGenerator(generator) {
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
    findPluginIndex(generator) {
        for (let i = 0; i < this.generators.length; i++) {
            let entry = this.generators[i];
            if (entry.generator === generator)
                return i;
        }
        return -1;
    }
    updatePluginsInfo() {
        this.generators.forEach(plugin => {
            if (this.selected !== plugin && plugin.selected)
                plugin.selected = false;
        });
    }
    rerouteAudioNodes() { }
}
export class GeneratorEntry {
    constructor(generator, mgr) {
        this._selected = true;
        this.generator = generator;
        this.mgr = mgr;
    }
    get name() { return this.generator.name; }
    get selected() { return this._selected; }
    set selected(val) {
        this._selected = val;
        this.mgr.session.midi.defaultKeysListener = this.generator;
        if (val) {
            this.element.classList.add("selected");
        }
        else {
            this.element.classList.remove("selected");
        }
    }
}