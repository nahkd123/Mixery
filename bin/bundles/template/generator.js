import { AudioGenerator } from "../../mixerycore/generator.js";
import { GeneratorExplorerContent } from "../../mixeryui/explorer.js";
import { beatsToMS } from "../../utils/msbeats.js";
const NAME = "";
const AUTHORS = [];
export class ExampleGenerator extends AudioGenerator {
    constructor(preset) {
        super();
        this.name = NAME;
        this.author = AUTHORS;
    }
    generatorLoad(session, output) {
        this.session = session;
        this.output = output;
        this.initWindow();
    }
    playNote(note, sensitivity, offset, duration) {
        const engine = this.session.audioEngine;
        const bpm = this.session.bpm;
        const noteOffset = beatsToMS(offset, bpm) / 1000;
        const noteEnd = beatsToMS(offset + this.envelopes.gain.measureNoteTimeInBeats(duration), bpm) / 1000;
        let noteOutput = engine.createGain();
        noteOutput.connect(this.output);
    }
    stopPlayingClips() { }
    initWindow() {
        const view = this.pluginView;
    }
}
export default class ExampleExplorerContent extends GeneratorExplorerContent {
    constructor() {
        super(...arguments);
        this.name = NAME;
        this.author = AUTHORS;
    }
    constructPlugin(preset) {
        let plugin = new ExampleGenerator(preset);
        return plugin;
    }
}