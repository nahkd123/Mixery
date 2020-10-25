import RenderableGainNode from "../../mixeryaudio/nodes/gain.js";
import { AudioGenerator } from "../../mixerycore/generator.js";
import { Session } from "../../mixerycore/session.js";
import { GeneratorExplorerContent } from "../../mixeryui/explorer.js";
import { beatsToMS } from "../../utils/msbeats.js";

const NAME = "";
const AUTHORS = [];

export class ExampleGenerator extends AudioGenerator {
    name = NAME;
    author = AUTHORS;

    constructor(preset: object) {
        super();
    }

    session: Session;
    generatorLoad(session: Session, output: RenderableGainNode) {
        this.session = session;
        this.output = output;
        this.initWindow();
    }

    playNote(note: number, sensitivity: number, offset: number, duration: number) {
        const engine = this.session.audioEngine;
        const bpm = this.session.bpm;
        const noteOffset = beatsToMS(offset, bpm) / 1000;
        const noteEnd = beatsToMS(offset + this.envelopes.gain.measureNoteTimeInBeats(duration), bpm) / 1000;

        let noteOutput = engine.createGain();
        noteOutput.connect(this.output);
    }

    stopPlayingClips() {}

    initWindow() {
        const view = this.pluginView;
    }
}

export default class ExampleExplorerContent extends GeneratorExplorerContent {
    name = NAME;

    constructPlugin(preset: object) {
        let plugin = new ExampleGenerator(preset);
        return plugin;
    }
}