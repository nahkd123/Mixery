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
import { NotesConfiguration } from "../../../mixerycore/notes.js";
import { GeneratorExplorerContent } from "../../../mixeryui/explorer.js";
import { beatsToMS } from "../../../utils/msbeats.js";
import { fixedSnap, fixedSnapCeil } from "../../../utils/snapper.js";
import { trimText } from "../../../utils/trimtext.js";
const NAME = "SamplesMap";
const AUTHORS = ["nahkd123"];
const EXTENSION = ".smpreset";
export class SamplesMap extends AudioGenerator {
    constructor(preset) {
        super();
        this.name = NAME;
        this.author = AUTHORS;
        this.samples = [];
        this.sensitivitySnap = 0.125;
        this.canvasMenu = new ContextMenu();
        this.selectedNoteIndex = 0;
        this.selectedSensitivityLevel = 0; // 1 means near the keyboard
        this.selectToNoteIndex = 0;
        this.selectToSensitivityLevel = 0;
        this.scrolledNotes = 0;
        this.noteWidth = 10;
        this.keyboardSize = 25;
        this.blackKeysKeyboardSize = 15;
        this.octave = 12;
        this.blackKeys = [1, 3, 6, 8, 10];
    }
    generatorLoad(session, output) {
        this.session = session;
        this.output = output;
        this.initWindow();
    }
    findSample(note, sensitivity) {
        for (let i = 0; i < this.samples.length; i++) {
            const sample = this.samples[i];
            if (note >= sample.fromNote && note <= sample.toNote && sensitivity >= sample.sensitivityFrom && sensitivity <= sample.sensitivityTo)
                return sample;
        }
    }
    addSample(info) {
        this.samples.push(info);
        let element = document.createElement("div");
        element.style.marginBottom = "5px";
        element.style.boxShadow = "0 0 5px black";
        element.style.padding = "10px";
        element.textContent = info.name;
        this.samplesListing.append(element);
        let menu = new ContextMenu();
        menu.entries.push(new ContextMenuEntry("Remove", () => {
            this.samples.splice(this.samples.indexOf(info), 1);
            if (this.selectedSample === info)
                this.selectedSample = undefined;
            element.remove();
            this.renderMap();
        }));
        element.addEventListener("click", event => {
            if (this.selectedSample !== info)
                this.selectedSample = info;
            else
                this.selectedSample = undefined;
            this.renderMap();
        });
        element.addEventListener("contextmenu", event => {
            event.preventDefault();
            menu.openMenu(event.pageX + 1, event.pageY + 1);
        });
    }
    playNote(note, sensitivity, offset, duration) {
        const sample = this.findSample(note, sensitivity);
        if (sample === undefined)
            return;
        const engine = this.session.audioEngine;
        const bpm = this.session.bpm;
        const noteOffset = beatsToMS(offset, bpm) / 1000;
        const noteEnd = beatsToMS(offset + this.envelopes.gain.measureNoteTimeInBeats(duration), bpm) / 1000;
        let noteOutput = engine.createGain();
        noteOutput.connect(this.output);
        let bufferSource = engine.createBufferSource(sample.sample);
        bufferSource.detune.value = (note - sample.baseNote) * 100;
        bufferSource.connect(noteOutput);
        bufferSource.start(engine.liveTime + noteOffset);
    }
    stopPlayingClips() { }
    initWindow() {
        this.window.width = 600;
        this.window.height = 320;
        const view = this.pluginView;
        view.style.backgroundColor = "#272727";
        this.mapCanvas = document.createElement("canvas");
        this.mapCanvas.width = 350;
        this.mapCanvas.height = 262;
        view.append(this.mapCanvas);
        this.ctx = this.mapCanvas.getContext("2d");
        this.renderMap();
        this.samplesListing = document.createElement("div");
        this.samplesListing.style.display = "inline-block";
        this.samplesListing.style.width = "230px";
        this.samplesListing.style.height = "242px";
        this.samplesListing.style.padding = "10px";
        this.samplesListing.style.overflowY = "scroll";
        this.samplesListing.style.backgroundColor = "white";
        this.samplesListing.style.color = "black";
        view.append(this.samplesListing);
        this.canvasMenu.entries.push(new ContextMenuEntry("Export as " + EXTENSION, () => {
            let name = this.name;
            if (!globalThis.electronjs)
                name = prompt("Type file name to export:", name);
            this.downloadPluginPreset(name);
        }));
        this.canvasMenu.entries.push(new ContextMenuEntry("Import " + EXTENSION, () => {
            let element = document.createElement("input");
            element.type = "file";
            element.style.display = "none";
            document.body.appendChild(element);
            element.click();
            element.remove();
            element.addEventListener("change", (event) => __awaiter(this, void 0, void 0, function* () {
                if (element.files.length === 0)
                    return;
                let file = element.files.item(0);
                if (!file.name.endsWith(EXTENSION))
                    return;
                this.importPluginPreset(yield file.arrayBuffer());
            }));
        }));
        this.mapCanvas.addEventListener("wheel", event => {
            this.scrolledNotes += (event.shiftKey ? event.deltaY : event.deltaX) / 10;
            if (this.scrolledNotes < 0)
                this.scrolledNotes = 0;
            this.renderMap();
        });
        let mouseDown = false;
        this.mapCanvas.addEventListener("mousedown", event => {
            if (event.offsetY >= this.mapCanvas.height - this.keyboardSize) {
                if (this.selectedSample === undefined)
                    return;
                this.selectedSample.baseNote = Math.floor(event.offsetX / this.noteWidth + this.scrolledNotes);
            }
            else {
                this.selectedNoteIndex = this.selectToNoteIndex = Math.floor(event.offsetX / this.noteWidth + this.scrolledNotes);
                this.selectedSensitivityLevel = this.selectToSensitivityLevel = fixedSnap(Math.min(event.offsetY / (this.mapCanvas.height - this.keyboardSize), 1.0), this.sensitivitySnap);
                mouseDown = true;
            }
            this.renderMap();
        });
        this.mapCanvas.addEventListener("mousemove", event => {
            if (!mouseDown)
                return;
            this.selectToNoteIndex = Math.floor(event.offsetX / this.noteWidth + this.scrolledNotes);
            this.selectToSensitivityLevel = fixedSnapCeil(Math.min(event.offsetY / (this.mapCanvas.height - this.keyboardSize), 1.0), this.sensitivitySnap);
            this.renderMap();
        });
        this.mapCanvas.addEventListener("mouseup", event => {
            mouseDown = false;
            if (this.selectedNoteIndex === this.selectToNoteIndex && this.selectedSensitivityLevel === this.selectToSensitivityLevel) {
                this.selectedSample = undefined;
                for (let i = 0; i < this.samples.length; i++) {
                    const sample = this.samples[i];
                    if (this.selectedNoteIndex >= sample.fromNote && this.selectedNoteIndex <= sample.toNote && this.selectedSensitivityLevel >= sample.sensitivityFrom && this.selectedSensitivityLevel <= sample.sensitivityTo) {
                        this.selectedSample = sample;
                        break;
                    }
                }
            }
            this.renderMap();
        });
        this.mapCanvas.addEventListener("contextmenu", event => {
            event.preventDefault();
            this.canvasMenu.openMenu(event.pageX + 1, event.pageY + 1);
        });
        this.mapCanvas.addEventListener("dragover", event => {
            event.preventDefault();
        });
        this.mapCanvas.addEventListener("drop", (event) => __awaiter(this, void 0, void 0, function* () {
            event.preventDefault();
            if (event.dataTransfer.files.length === 0)
                return;
            let mainFile = event.dataTransfer.files.item(0);
            let arrayBuffer = yield mainFile.arrayBuffer();
            if (mainFile.name.endsWith(EXTENSION)) {
                this.importPluginPreset(arrayBuffer);
            }
            else {
                let orignalBlob = new Blob([new Uint8Array(arrayBuffer)], { type: mainFile.type });
                let audioBuffer = yield this.session.audioEngine.decodeAudio(arrayBuffer);
                let mapInfo = {
                    sample: audioBuffer,
                    orignal: orignalBlob,
                    name: mainFile.name,
                    baseNote: this.selectedNoteIndex,
                    fromNote: this.selectedNoteIndex,
                    toNote: this.selectToNoteIndex - 1,
                    sensitivityFrom: this.selectedSensitivityLevel,
                    sensitivityTo: this.selectToSensitivityLevel,
                    outputGainFrom: this.selectedSensitivityLevel,
                    outputGainTo: this.selectToSensitivityLevel
                };
                this.addSample(mapInfo);
                this.selectedSample = mapInfo;
                this.renderMap();
            }
        }));
    }
    renderMap() {
        const canvas = this.mapCanvas;
        const ctx = this.ctx;
        const gridColor = "#ffffff12";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const scrolledNotes = Math.floor(this.scrolledNotes);
        const octave = this.octave;
        const blackKeys = this.blackKeys;
        const noteWidth = this.noteWidth;
        const notesPerPage = Math.ceil(canvas.width / noteWidth) + 1;
        ctx.fillStyle = gridColor;
        for (let i = 0; i < notesPerPage; i++) {
            ctx.fillRect(i * noteWidth, 0, 1, canvas.height - this.keyboardSize);
        }
        for (let i = 0; i < 1; i += this.sensitivitySnap) {
            ctx.fillRect(0, i * (canvas.height - this.keyboardSize), canvas.width, 1);
        }
        ctx.font = `12px "Nunito Sans", "Segoe UI", sans-serif`;
        this.samples.forEach(sample => {
            const renderX = (sample.fromNote - scrolledNotes) * noteWidth;
            const renderY = sample.sensitivityFrom * (canvas.height - this.keyboardSize);
            const renderW = (sample.toNote - sample.fromNote + 1) * noteWidth - 1;
            const renderH = (sample.sensitivityTo - sample.sensitivityFrom) * (canvas.height - this.keyboardSize);
            if (renderW <= 0 || renderH <= 0)
                return;
            const selected = this.selectedSample === sample;
            ctx.fillStyle = selected ? "#ff7a7a" : "#ffffff";
            ctx.fillRect(renderX, renderY, renderW, renderH);
            ctx.fillStyle = "black";
            ctx.fillText(trimText(sample.name, ctx, renderW), renderX + 7, renderY + 16);
        });
        const keyboardSize = this.keyboardSize;
        const blackKeysSize = this.blackKeysKeyboardSize;
        const selectedSample = this.selectedSample;
        renderKeyboard();
        const selectFromX = this.selectedNoteIndex;
        const selectFromY = this.selectedSensitivityLevel;
        const selectedNotes = this.selectToNoteIndex - selectFromX;
        const selectedSensitivity = this.selectToSensitivityLevel - selectFromY;
        const selectColor = "#ffffff12";
        renderSelection();
        function renderKeyboard() {
            const keyboardY = canvas.height - keyboardSize;
            let previousBlackKey = false;
            for (let i = 0; i < notesPerPage; i++) {
                const noteIndex = scrolledNotes + i;
                const octNoteIndex = noteIndex % octave;
                const blackKey = blackKeys.includes(octNoteIndex);
                ctx.fillStyle = ((selectedSample === null || selectedSample === void 0 ? void 0 : selectedSample.baseNote) === noteIndex) ? "#ff7a7a" : blackKey ? "black" : "white";
                ctx.fillRect(i * noteWidth, keyboardY, noteWidth * (blackKeys.includes(octNoteIndex + 1) ? 1.5 : 1) - 1, blackKey ? blackKeysSize : keyboardSize);
                if (octNoteIndex === 0) {
                    ctx.fillStyle = "black";
                    ctx.fillText(noteIndex / octave + "", i * noteWidth + 2, canvas.height - 3);
                }
                if (previousBlackKey)
                    ctx.fillRect((i - 0.5) * noteWidth, keyboardY + blackKeysSize, noteWidth / 2, keyboardSize - blackKeysSize);
                previousBlackKey = blackKeys.includes(octNoteIndex);
                if (!blackKey) {
                    ctx.fillStyle = "white";
                    ctx.fillText(NotesConfiguration.NOTE_NAMING[octNoteIndex] + "", i * noteWidth + 2, canvas.height - keyboardSize - 3);
                }
            }
        }
        function renderSelection() {
            const samplesArea = canvas.height - keyboardSize;
            ctx.fillStyle = selectColor;
            ctx.fillRect((selectFromX - scrolledNotes) * noteWidth, samplesArea * selectFromY, noteWidth * selectedNotes, samplesArea * selectedSensitivity);
        }
    }
    static stringToArray(str) {
        let data = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++)
            data[i] = str.charCodeAt(i);
        return data;
    }
    static uInt32ToArray(val) {
        return new Uint8Array([
            (val & 0xFF000000) >> 24,
            (val & 0x00FF0000) >> 16,
            (val & 0x0000FF00) >> 8,
            val & 0x000000FF
        ]);
    }
    static convertSampleMapToBlob(sample) {
        let sampleBlob = this.stringToArray(JSON.stringify({
            name: sample.name,
            baseNote: sample.baseNote,
            fromNote: sample.fromNote,
            toNote: sample.toNote,
            sensitivityFrom: sample.sensitivityFrom,
            sensitivityTo: sample.sensitivityTo,
            outputGainFrom: sample.outputGainFrom,
            outputGainTo: sample.outputGainTo
        }));
        return new Blob([
            this.uInt32ToArray(sampleBlob.length),
            sampleBlob,
            this.uInt32ToArray(sample.orignal.size),
            sample.orignal
        ]);
    }
    convertPresetToBlob() {
        let contents = [];
        this.samples.forEach(sample => {
            let blob = SamplesMap.convertSampleMapToBlob(sample);
            contents.push(SamplesMap.uInt32ToArray(blob.size));
            contents.push(blob);
        });
        return new Blob(contents);
    }
    downloadPluginPreset(outputName) {
        let a = document.createElement("a");
        a.href = URL.createObjectURL(this.convertPresetToBlob());
        a.download = outputName + EXTENSION;
        a.click();
        URL.revokeObjectURL(a.href);
    }
    importPluginPreset(input) {
        return __awaiter(this, void 0, void 0, function* () {
            function createStream(input) {
                return __awaiter(this, void 0, void 0, function* () {
                    let stream = {
                        buffer: new Uint8Array((input instanceof ArrayBuffer) ? input : yield input.arrayBuffer()),
                        pos: 0,
                        eof() { return stream.pos >= stream.buffer.length; },
                        readUint32() {
                            let val = (stream.buffer[stream.pos] << 24) + (stream.buffer[stream.pos + 1] << 16) + (stream.buffer[stream.pos + 2] << 8) + stream.buffer[stream.pos + 3];
                            stream.pos += 4;
                            return val;
                        },
                        readChunk(length) {
                            let out = stream.buffer.slice(stream.pos, stream.pos + length);
                            stream.pos += length;
                            return out;
                        },
                        readLengthPrefixedChunk() {
                            let length = stream.readUint32();
                            return stream.readChunk(length);
                        },
                        readLengthPrefixedString() {
                            let str = "";
                            let data = stream.readLengthPrefixedChunk();
                            console.log("string", data);
                            for (let i = 0; i < data.length; i++)
                                str += String.fromCharCode(data[i]);
                            return str;
                        }
                    };
                    return stream;
                });
            }
            let fileStream = yield createStream(input);
            console.log("file", fileStream.buffer);
            while (!fileStream.eof()) {
                let chunkStream = yield createStream(fileStream.readLengthPrefixedChunk().buffer);
                console.log("chunk", chunkStream.buffer);
                let json = chunkStream.readLengthPrefixedString();
                let header = JSON.parse(json);
                let data = chunkStream.readLengthPrefixedChunk();
                let dataBlob = new Blob([data]);
                let sample = yield this.session.audioEngine.decodeAudio(data.buffer);
                let mapInfo = {
                    sample,
                    orignal: dataBlob,
                    name: header.name,
                    baseNote: header.baseNote,
                    fromNote: header.fromNote,
                    toNote: header.toNote,
                    sensitivityFrom: header.sensitivityFrom,
                    sensitivityTo: header.sensitivityTo,
                    outputGainFrom: header.outputGainFrom,
                    outputGainTo: header.outputGainT
                };
                this.addSample(mapInfo);
            }
            this.renderMap();
        });
    }
}
export default class SamplesMapExplorerContent extends GeneratorExplorerContent {
    constructor() {
        super(...arguments);
        this.name = NAME;
    }
    constructPlugin(preset) {
        let plugin = new SamplesMap(preset);
        return plugin;
    }
}