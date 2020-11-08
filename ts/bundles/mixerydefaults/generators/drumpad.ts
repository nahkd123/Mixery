import RenderableGainNode from "../../../mixeryaudio/nodes/gain.js";
import { AudioGenerator } from "../../../mixerycore/generator.js";
import { Session } from "../../../mixerycore/session.js";
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
export interface DrumSample {
    name: string;
    buffer: AudioBuffer;
    padColor: string;
    orignal?: ArrayBuffer;
}

export class DrumPad extends AudioGenerator {
    name = NAME;
    author = AUTHORS;

    noteNamesOverride = new Map<number, [string, string]>();
    drumSamples: DrumSample[] = [];
    readonly startNote = 57;
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
        if (this.drumSamples[note - this.startNote] === undefined) return;
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

    stopPlayingClips() {}

    initWindow() {
        this.window.width = 550;
        this.window.height = 340;
        const view = this.pluginView;
        view.style.backgroundColor = "#150600";
        view.style.overflowX = "scroll";

        let toolsBar = document.createElement("div");
        toolsBar.style.backgroundColor = "#ffffff0d";
        function createToolButton(img: string, listener: (event: MouseEvent) => void) {
            let element = document.createElement("div");
            element.style.width = "32px";
            element.style.height = "32px";
            element.style.display = "inline-block";
            element.style.paddingTop = "3px";
            element.style.marginLeft = "5px";

            element.style.webkitMaskSize = "cover";
            element.style.webkitMaskPosition = "center";
            element.style.webkitMaskImage = `url(${img})`;
            element.style.maskSize = "cover";
            element.style.maskPosition = "center";
            element.style.maskImage = `url(${img})`;
            element.style.backgroundColor = "white";
            toolsBar.appendChild(element);
            element.addEventListener("click", event => {
                listener(event);
            });
        }
        createToolButton("../assets/icons/add-file.svg", () => {
            let inputElement = document.createElement("input");
            inputElement.type = "file";
            inputElement.style.display = "none";
            document.body.appendChild(inputElement);
            inputElement.click();
            inputElement.remove();

            inputElement.addEventListener("change", async event => {
                for (let i = 0; i < inputElement.files.length; i++) this.processFile(inputElement.files.item(i));
            });
        });
        view.append(toolsBar);

        view.addEventListener("dragover", event => {
            event.preventDefault();
        });
        view.addEventListener("drop", event => {
            event.preventDefault();
            // console.log(event.dataTransfer.files.item(0).arrayBuffer());
            for (let i = 0; i < event.dataTransfer.files.length; i++) this.processFile(event.dataTransfer.files.item(i));
        });
    }

    async loadFromServer(path: string, name?: string) {
        let fetchInfo = await fetch(path);
        let arrayBuffer = await fetchInfo.arrayBuffer();
        let audio = await this.session.audioEngine.decodeAudio(arrayBuffer);
        this.addPad({
            name: name || path,
            buffer: audio,
            orignal: arrayBuffer,
            padColor: PAD_COLORS[Math.floor(Math.random() * PAD_COLORS.length)]
        });
    }
    async processFile(file: File) {
        const name = file.name;
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await this.session.audioEngine.decodeAudio(arrayBuffer);
        this.addPad({
            name,
            buffer: audioBuffer,
            orignal: arrayBuffer,
            padColor: PAD_COLORS[Math.floor(Math.random() * PAD_COLORS.length)]
        });
    }
    addPad(sample: DrumSample) {
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
    private updateNoteNamesOverride() {
        this.noteNamesOverride.clear();
        this.drumSamples.forEach((sample, index) => {
            this.noteNamesOverride.set(this.startNote + index, [sample.name, sample.padColor]);
        });
    }
}

export default class DrumPadExplorerContent extends GeneratorExplorerContent {
    name = NAME;
    author = AUTHORS;

    constructPlugin(preset: object) {
        let plugin = new DrumPad(preset);
        return plugin;
    }
}