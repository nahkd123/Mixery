import ContextMenu, { ContextMenuEntry } from "../../../contextmenus/menu.js";
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

    sampleSelectMenu = new ContextMenu();
    sampleSelectButton: HTMLDivElement;
    initWindow() {
        const view = this.pluginView;

        let label0 = document.createElement("div");
        label0.textContent = "Selected sample:";
        label0.style.padding = "5px 12px";
        view.appendChild(label0);

        this.sampleSelectButton = document.createElement("div");
        this.sampleSelectButton.textContent = this.selectedSample;
        this.sampleSelectButton.style.padding = "5px 12px";
        this.sampleSelectButton.style.margin = "5px 12px";
        this.sampleSelectButton.style.border = "2px solid #cecece";
        this.sampleSelectButton.style.borderRadius = "3px";
        this.sampleSelectButton.addEventListener("click", event => {
            this.sampleSelectMenu.openMenu(event.pageX, event.pageY);
        });
        view.appendChild(this.sampleSelectButton);
    }

    samples: Map<string, AudioBuffer> = new Map();
    samplesNoteMapping = {};
    initSamples() {
        let self = this;
        async function fetchAndLoadSample(name: string, noteMapping: number | string = "A4") {
            self.samplesNoteMapping[name] = typeof noteMapping === "number"? noteMapping : notesIndex.get(noteMapping);
            self.sampleSelectMenu.entries.push(new ContextMenuEntry(name, () => {
                self.selectedSample = name;
                self.sampleSelectButton.textContent = name;
            }));

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
    author = AUTHORS;

    constructPlugin(preset: object) {
        let plugin = new CheapPiano(preset);
        return plugin;
    }
}