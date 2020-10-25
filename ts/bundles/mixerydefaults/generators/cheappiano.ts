import RenderableGainNode from "../../../mixeryaudio/nodes/gain.js";
import { AudioGenerator } from "../../../mixerycore/generator.js";
import { notesFrequency, notesIndex } from "../../../mixerycore/notes.js";
import { Session } from "../../../mixerycore/session.js";
import { GeneratorExplorerContent } from "../../../mixeryui/explorer.js";
import { beatsToMS } from "../../../utils/msbeats.js";

const NAME = "CheapPiano";
const AUTHORS = ["nahkd123"];

export class CheapPiano extends AudioGenerator {
    name = NAME;
    author = AUTHORS;

    // Preset contents
    selectedSample: string;

    constructor(preset: any = {}) {
        super();
        this.selectedSample = preset.selectedSample || "Grand Piano (Short)";
    }

    session: Session;
    generatorLoad(session: Session, output: RenderableGainNode) {
        this.session = session;
        this.output = output;
        this.initWindow();
        this.initSamples();
    }

    playNote(note: number, sensitivity: number, offset: number, duration: number) {
        if (!this.samples.has(this.selectedSample)) return;
        const sample = this.samples.get(this.selectedSample);

        const engine = this.session.audioEngine;
        const bpm = this.session.bpm;
        const noteOffset = beatsToMS(offset, bpm) / 1000;
        const noteEnd = beatsToMS(offset + this.envelopes.gain.measureNoteTimeInBeats(duration), bpm) / 1000;

        let noteOutput = engine.createGain();
        noteOutput.connect(this.output);

        let bufferSource = engine.createBufferSource(sample);
        bufferSource.detune.value = (note - this.samplesNoteMapping[this.selectedSample]) * 100;
        bufferSource.connect(noteOutput);
        bufferSource.start(engine.liveTime + noteOffset);
    }

    initWindow() {
        const view = this.pluginView;
    }

    samples: Map<string, AudioBuffer> = new Map();
    samplesNoteMapping = {};
    initSamples() {
        let self = this;
        async function fetchAndLoadSample(name: string, noteMapping: number | string = "A4") {
            self.samplesNoteMapping[name] = typeof noteMapping === "number"? noteMapping : notesIndex.get(noteMapping);

            let fetchData = await fetch("/assets/bundles/default/CheapPiano " + name + ".wav");
            let arrayBuffer = await fetchData.arrayBuffer();
            self.samples.set(name, await self.session.audioEngine.decodeAudio(arrayBuffer));
        }
        fetchAndLoadSample("Grand Piano", "C5");
        fetchAndLoadSample("Grand Piano (Short)");
        fetchAndLoadSample("Broken Piano", "E4");
    }
}

export default class CheapPianoExplorerContent extends GeneratorExplorerContent {
    name = NAME;

    constructPlugin(preset: object) {
        let plugin = new CheapPiano(preset);
        return plugin;
    }
}