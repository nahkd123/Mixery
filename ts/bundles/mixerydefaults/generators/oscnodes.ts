import { ByteStream } from "../../../fileformat/filestream.js";
import AudioAutomation from "../../../mixeryaudio/automations/automation.js";
import RenderableGainNode from "../../../mixeryaudio/nodes/gain.js";
import RenderableOscillatorNode from "../../../mixeryaudio/nodes/oscillator.js";
import { MIDIClip } from "../../../mixerycore/clips.js";
import { AudioGenerator } from "../../../mixerycore/generator.js";
import { notesFrequency } from "../../../mixerycore/notes.js";
import { Session } from "../../../mixerycore/session.js";
import AudioAutomator from "../../../mixeryui/automations/automator.js";
import { GeneratorExplorerContent } from "../../../mixeryui/explorer.js";
import { HorizontalSliderParamControl } from "../../../mixeryui/params/paramcontrol.js";
import { beatsToMS } from "../../../utils/msbeats.js";

export default class OscNodesExplorerContent extends GeneratorExplorerContent {
    name = "OscNodes";
    author = ["nahkd123"];

    constructPlugin(preset: object) {
        let plugin = new OscNodes();
        return plugin;
    }
}

class OscillatorsType {
    id: OscillatorType;
    name: string;
    icon: string;
    addIcon: string;

    constructor(id: OscillatorType, name: string, icon: string, addIcon = icon) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.addIcon = addIcon;
    }
}
namespace OscillatorsTypes {
    export const SINE = new OscillatorsType("sine", "Sine", "../assets/icons/sinewave.svg", "../assets/icons/add-sinewave.svg");
    export const SQUARE = new OscillatorsType("square", "Square", "../assets/icons/squarewave.svg", "../assets/icons/add-squarewave.svg");
    export const SAWTOOTH = new OscillatorsType("sawtooth", "Sawtooth", "../assets/icons/squarewave.svg", "../assets/icons/add-squarewave.svg");
    export const TRIANGLE = new OscillatorsType("triangle", "Triangle", "../assets/icons/squarewave.svg", "../assets/icons/add-squarewave.svg");

    export const oscillators = [SINE, SQUARE, SAWTOOTH, TRIANGLE];
}

interface Oscillator {
    name: string;
    type: OscillatorsType;
    semitonesOffset: number;

    gain: RenderableGainNode;
}
interface OscillatorNote {
    gain: RenderableGainNode; // Act like velocity
    osc: RenderableOscillatorNode;
}

export class OscNodes extends AudioGenerator {
    name = "OscNodes";
    author = ["nahkd123"];

    oscillators: Oscillator[] = [];
    session: Session;
    output: RenderableGainNode;

    oscListing: HTMLDivElement;

    playingNotes: OscillatorNote[] = [];

    generatorLoad(session: Session, output: RenderableGainNode) {
        this.session = session;
        this.output = output;

        this.initWindow();
    }

    initWindow() {
        let window = this.window;
        window.width = 350;
        window.height = 300;
        this.pluginView.classList.add("oscnodesparent");

        let toolsBar = document.createElement("div");
        toolsBar.className = "toolsbar";

        OscillatorsTypes.oscillators.forEach(oscType => {
            let addButton = document.createElement("div");
            addButton.className = "addosc";
            addButton.style.webkitMaskImage = "url(\"" + oscType.addIcon + "\")";
            addButton.style.maskImage = "url(\"" + oscType.addIcon + "\")";
            toolsBar.append(addButton);

            addButton.addEventListener("click", event => {
                this.addOscillator(oscType);
            });
        });

        this.oscListing = document.createElement("div");
        this.oscListing.className = "osclisting";

        this.pluginView.append(toolsBar, this.oscListing);
    }

    addOscillator(type: OscillatorsType) {
        let osc: Oscillator = {
            name: type.name + " " + (this.oscillators.length + 1),
            type,
            semitonesOffset: 0,
            gain: this.session.audioEngine.createGain()
        };
        osc.gain.connect(this.output);
        this.oscillators.push(osc);

        let element = document.createElement("div");
        element.className = "oscentry";

        let label = document.createElement("div"); label.className = "label";
        label.textContent = osc.name;

        let toolsbar = document.createElement("div"); toolsbar.className = "toolsbar";

        let removeButton = document.createElement("div"); removeButton.className = "remove";
        toolsbar.append(removeButton);

        removeButton.addEventListener("click", event => {
            this.oscillators.splice(this.oscillators.indexOf(osc), 1);
            element.remove();
        });

        let toolsbarOscButtons: HTMLDivElement[] = [];
        OscillatorsTypes.oscillators.forEach(oscType => {
            let changeOscButton = document.createElement("div");
            changeOscButton.className = "changeosc" + (oscType === osc.type? " on": "");
            changeOscButton.style.webkitMaskImage = "url(\"" + oscType.icon + "\")";
            changeOscButton.style.maskImage = "url(\"" + oscType.icon + "\")";
            toolsbar.appendChild(changeOscButton);
            toolsbarOscButtons.push(changeOscButton);

            changeOscButton.addEventListener("click", event => {
                osc.type = oscType;

                toolsbarOscButtons.forEach(button => {button.classList.remove("on");});
                changeOscButton.classList.add("on");
            });
        });

        let gainSlider = new HorizontalSliderParamControl(this.session, this.name + " - " + osc.name + " - Gain", osc.gain.gain, 150);
        gainSlider.color = "#5be6ff";
        gainSlider.minValue = 0; gainSlider.maxValue = 1; gainSlider.defaultValue = 1;

        element.append(label, toolsbar, gainSlider.element);
        this.oscListing.append(element);
        return osc;
    }

    playNote(note: number, sensitivity: number, offset: number, duration: number) {
        const noteOffset = beatsToMS(offset, this.session.bpm) / 1000;
        const noteEnd = beatsToMS(offset + this.envelopes.gain.measureNoteTimeInBeats(duration), this.session.bpm) / 1000;

        this.oscillators.forEach(oscillator => {
            let oscNote: OscillatorNote = {
                gain: this.session.audioEngine.createGain(),
                osc: this.session.audioEngine.createOscillator()
            };
            oscNote.osc.connect(oscNote.gain);
            // oscNote.gain.connect(this.mixerTrack.input);
            oscNote.gain.connect(oscillator.gain);

            // oscNote.gain.gain.value = note.sensitivity;
            // oscillator.gainAutomation.apply(oscNote.gain.gain, sensitivity, noteOffset);
            this.envelopes.gain.applyNoteInMS(oscNote.gain.gain, beatsToMS(duration, this.session.bpm), this.session.bpm, sensitivity, noteOffset * 1000);
            oscNote.osc.type = oscillator.type.id;
            oscNote.osc.frequency.value = notesFrequency[note];
            // oscillator.frequencyAutomation.apply(oscNote.osc.detune, 100, noteOffset);

            oscNote.osc.start(this.session.audioEngine.liveTime + noteOffset);
            oscNote.osc.stop(this.session.audioEngine.liveTime + noteEnd);
            this.playingNotes.push(oscNote);
        });
    }

    playingMIDINote: OscillatorNote[][] = [];
    midiKeyDown(note: number, sensitivity: number) {
        if (this.playingMIDINote[note] !== undefined) return;
        let oscs: OscillatorNote[] = [];

        this.oscillators.forEach(oscillator => {
            let oscNote: OscillatorNote = {
                gain: this.session.audioEngine.createGain(),
                osc: this.session.audioEngine.createOscillator()
            };
            oscNote.osc.connect(oscNote.gain);
            oscNote.gain.connect(oscillator.gain);

            this.envelopes.gain.applyNoteInMS(oscNote.gain.gain, 60000, this.session.bpm, sensitivity);
            oscNote.osc.type = oscillator.type.id;
            oscNote.osc.frequency.value = notesFrequency[note];

            oscNote.osc.start(this.session.audioEngine.liveTime);
            oscs.push(oscNote);
        });

        this.playingMIDINote[note] = oscs;
    }
    midiKeyUp(note: number) {
        const decayTime = this.envelopes.gain.measureNoteTimeInMS(0, this.session.bpm) / 1000;
        this.playingMIDINote[note]?.forEach(osc => {
            osc.osc.stop(this.session.audioEngine.liveTime + decayTime);
            osc.gain.gain.cancelAndHoldAtValue(this.session.audioEngine.liveTime);
            osc.gain.gain.linearRampToValueAtNextTime(decayTime, 0);
        });
        this.playingMIDINote[note] = undefined;
    }

    stopPlayingClips() {
        this.playingNotes.forEach(note => {
            note.gain.disconnect();
            note.osc.disconnect();
        });
    }

    writePluginData(stream: ByteStream.WriteableStream) {
        stream.writeVarInt(this.oscillators.length);
        this.oscillators.forEach(osc => {
            stream.writeString(osc.name);
            stream.writeString(osc.type.id);
        });
    }
}