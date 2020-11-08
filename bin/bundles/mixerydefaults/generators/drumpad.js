var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AudioGenerator } from "../../../mixerycore/generator.js";
import { GeneratorExplorerContent } from "../../../mixeryui/explorer.js";
import { beatsToMS } from "../../../utils/msbeats.js";
const NAME = "DrumPad";
const AUTHORS = ["nahkd123"];
const PAD_COLORS = [
    "#ff4900",
    "#00adff",
    "#ff008d",
    "#65ea00"
];
export class DrumPad extends AudioGenerator {
    constructor(preset) {
        super();
        this.name = NAME;
        this.author = AUTHORS;
        this.noteNamesOverride = new Map();
        this.drumSamples = [];
        this.startNote = 57;
    }
    generatorLoad(session, output) {
        this.session = session;
        this.output = output;
        this.initWindow();
        this.loadFromServer("../assets/test-assets/drum/Drum/35-Kick1Alt-5.wav", "Kick");
        this.loadFromServer("../assets/test-assets/drum/Drum/37-Sidestick2-4.wav", "Sidestick");
        this.loadFromServer("../assets/test-assets/drum/Drum/38-Snare-4.wav", "Snare");
        this.loadFromServer("../assets/test-assets/drum/Drum/39-HandClap-4.wav", "Hand Clap");
        this.loadFromServer("../assets/test-assets/drum/Drum/45-Tom-4.wav", "Tom");
        this.loadFromServer("../assets/test-assets/drum/Drum/42-HiHatClosed-4.wav", "Hi Hat");
    }
    playNote(note, sensitivity, offset, duration) {
        if (this.drumSamples[note - this.startNote] === undefined)
            return;
        const drumSample = this.drumSamples[note - this.startNote];
        const engine = this.session.audioEngine;
        const bpm = this.session.bpm;
        const noteOffset = beatsToMS(offset, bpm) / 1000;
        const noteEnd = beatsToMS(offset + this.envelopes.gain.measureNoteTimeInBeats(duration), bpm) / 1000;
        let noteOutput = engine.createGain();
        let buffer = engine.createBufferSource(drumSample.buffer);
        buffer.connect(noteOutput);
        noteOutput.connect(this.output);
        buffer.start(engine.liveTime + noteOffset);
    }
    stopPlayingClips() { }
    initWindow() {
        this.window.width = 550;
        this.window.height = 300;
        const view = this.pluginView;
        view.style.backgroundColor = "#150600";
        view.style.overflowX = "scroll";
        view.addEventListener("dragover", event => {
            event.preventDefault();
        });
        view.addEventListener("drop", event => {
            event.preventDefault();
            for (let i = 0; i < event.dataTransfer.files.length; i++)
                this.processFile(event.dataTransfer.files.item(i));
        });
    }
    loadFromServer(path, name) {
        return __awaiter(this, void 0, void 0, function* () {
            let fetchInfo = yield fetch(path);
            let arrayBuffer = yield fetchInfo.arrayBuffer();
            let audio = yield this.session.audioEngine.decodeAudio(arrayBuffer);
            this.addPad({
                name: name || path,
                buffer: audio,
                orignal: arrayBuffer,
                padColor: PAD_COLORS[Math.floor(Math.random() * PAD_COLORS.length)]
            });
        });
    }
    processFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const name = file.name;
            const arrayBuffer = yield file.arrayBuffer();
            const audioBuffer = yield this.session.audioEngine.decodeAudio(arrayBuffer);
            this.addPad({
                name,
                buffer: audioBuffer,
                orignal: arrayBuffer,
                padColor: PAD_COLORS[Math.floor(Math.random() * PAD_COLORS.length)]
            });
        });
    }
    addPad(sample) {
        const view = this.pluginView;
        let element = document.createElement("div");
        element.style.backgroundColor = sample.padColor;
        element.style.margin = "10px 0 0 10px";
        element.style.borderRadius = "3px";
        element.style.display = "inline-block";
        element.style.width = "150px";
        element.style.height = "104px";
        let innerElement = document.createElement("div");
        innerElement.textContent = sample.name;
        innerElement.style.backgroundColor = "#00000050";
        innerElement.style.color = "white";
        innerElement.style.padding = "5px 12px";
        innerElement.style.marginLeft = "6px";
        innerElement.style.borderRadius = "3px";
        innerElement.style.height = "94px";
        innerElement.style.overflow = "hidden";
        innerElement.style.whiteSpace = "nowarp";
        element.append(innerElement);
        view.append(element);
        this.drumSamples.push(sample);
        element.addEventListener("mousedown", event => {
            event.preventDefault();
            let buffer = this.session.audioEngine.createBufferSource(sample.buffer);
            buffer.connect(this.output);
            buffer.start(this.session.audioEngine.liveTime);
        });
        element.addEventListener("touchstart", event => {
            event.preventDefault();
            let buffer = this.session.audioEngine.createBufferSource(sample.buffer);
            buffer.connect(this.output);
            buffer.start(this.session.audioEngine.liveTime);
        });
        this.updateNoteNamesOverride();
    }
    updateNoteNamesOverride() {
        this.noteNamesOverride.clear();
        this.drumSamples.forEach((sample, index) => {
            this.noteNamesOverride.set(this.startNote + index, [sample.name, sample.padColor]);
        });
    }
}
export default class DrumPadExplorerContent extends GeneratorExplorerContent {
    constructor() {
        super(...arguments);
        this.name = NAME;
        this.author = AUTHORS;
    }
    constructPlugin(preset) {
        let plugin = new DrumPad(preset);
        return plugin;
    }
}