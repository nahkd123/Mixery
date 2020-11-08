var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import ContextMenu, { ContextMenuEntry } from "../../../contextmenus/menu.js";
import { AudioGenerator } from "../../../mixerycore/generator.js";
import { notesIndex } from "../../../mixerycore/notes.js";
import { GeneratorExplorerContent } from "../../../mixeryui/explorer.js";
import { beatsToMS } from "../../../utils/msbeats.js";
const NAME = "CheapPiano";
const AUTHORS = ["nahkd123"];
export class CheapPiano extends AudioGenerator {
    constructor(preset = {}) {
        super();
        this.name = NAME;
        this.author = AUTHORS;
        this.sampleSelectMenu = new ContextMenu();
        this.samples = new Map();
        this.samplesNoteMapping = {};
        this.selectedSample = preset.selectedSample || "Grand Piano (Short)";
    }
    generatorLoad(session, output) {
        this.session = session;
        this.output = output;
        this.initWindow();
        this.initSamples();
    }
    playNote(note, sensitivity, offset, duration) {
        if (!this.samples.has(this.selectedSample))
            return;
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
    initSamples() {
        let self = this;
        function fetchAndLoadSample(name, noteMapping = "A4") {
            return __awaiter(this, void 0, void 0, function* () {
                self.samplesNoteMapping[name] = typeof noteMapping === "number" ? noteMapping : notesIndex.get(noteMapping);
                self.sampleSelectMenu.entries.push(new ContextMenuEntry(name, () => {
                    self.selectedSample = name;
                    self.sampleSelectButton.textContent = name;
                }));
                let fetchData = yield fetch("/assets/bundles/default/CheapPiano " + name + ".wav");
                let arrayBuffer = yield fetchData.arrayBuffer();
                self.samples.set(name, yield self.session.audioEngine.decodeAudio(arrayBuffer));
            });
        }
        fetchAndLoadSample("Grand Piano", "C5");
        fetchAndLoadSample("Grand Piano (Short)");
        fetchAndLoadSample("Broken Piano", "E4");
    }
}
export default class CheapPianoExplorerContent extends GeneratorExplorerContent {
    constructor() {
        super(...arguments);
        this.name = NAME;
        this.author = AUTHORS;
    }
    constructPlugin(preset) {
        let plugin = new CheapPiano(preset);
        return plugin;
    }
}