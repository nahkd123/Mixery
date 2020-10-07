import AudioAutomation from "../../../mixeryaudio/automations/automation.js";
import RenderableGainNode from "../../../mixeryaudio/nodes/gain.js";
import RenderableOscillatorNode from "../../../mixeryaudio/nodes/oscillator.js";
import { MIDIClip } from "../../../mixerycore/clips.js";
import { AudioGenerator } from "../../../mixerycore/generator.js";
import { notesFrequency } from "../../../mixerycore/notes.js";
import { Session } from "../../../mixerycore/session.js";
import AudioAutomator from "../../../mixeryui/automations/automator.js";
import { GeneratorExplorerContent } from "../../../mixeryui/explorer.js";
import { beatsToMS } from "../../../utils/msbeats.js";

export default class OscNodesExplorerContent extends GeneratorExplorerContent {
    name = "OscNodes";

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
    export const SINE = new OscillatorsType("sine", "Sine", "/assets/icons/sinewave.svg", "/assets/icons/add-sinewave.svg");
    export const SQUARE = new OscillatorsType("square", "Square", "/assets/icons/squarewave.svg", "/assets/icons/add-squarewave.svg");

    export const oscillators = [SINE, SQUARE];
}

interface Oscillator {
    name: string;
    type: OscillatorsType;
    semitonesOffset: number;

    gainAutomation: AudioAutomation;
    gainAutomator: AudioAutomator;
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
        window.innerElement.classList.add("oscnodesparent");

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

        window.innerElement.append(toolsBar, this.oscListing);
    }

    addOscillator(type: OscillatorsType) {
        let automation = new AudioAutomation(
            {type: "linearRamp", time: 0.15, value: 0.9},
            {type: "linearRamp", time: 0.5, value: 0.25}
        );
        let automator = new AudioAutomator(null, automation, "OscNodes");

        let osc: Oscillator = {
            name: type.name + " " + (this.oscillators.length + 1),
            type,
            semitonesOffset: 0,

            gainAutomation: automation,
            gainAutomator: automator
        };
        this.oscillators.push(osc);

        let element = document.createElement("div");
        element.className = "oscentry";

        let label = document.createElement("div"); label.className = "label";
        label.textContent = osc.name;

        let toolsbar = document.createElement("div"); toolsbar.className = "toolsbar";

        let removeButton = document.createElement("div"); removeButton.className = "remove";
        let automationButton = document.createElement("div"); automationButton.className = "automation";
        toolsbar.append(removeButton, automationButton);

        removeButton.addEventListener("click", event => {
            this.oscillators.splice(this.oscillators.indexOf(osc), 1);
            element.remove();
        });
        automationButton.addEventListener("click", event => automator.window.show());

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

        element.append(label, toolsbar);
        this.oscListing.append(element);
        return osc;
    }

    playClip(clip: MIDIClip, clipOffset: number) {
        clip.notes.forEach(note => {
            // console.log(note);

            const noteOffset = beatsToMS(clipOffset + note.start, this.session.bpm) / 1000;
            const noteEnd = beatsToMS(clipOffset + note.start + note.duration, this.session.bpm) / 1000;

            this.oscillators.forEach(oscillator => {
                let oscNote: OscillatorNote = {
                    gain: this.session.audioEngine.createGain(),
                    osc: this.session.audioEngine.createOscillator()
                };
                oscNote.osc.connect(oscNote.gain);
                oscNote.gain.connect(this.mixerTrack.input);

                // oscNote.gain.gain.value = note.sensitivity;
                oscillator.gainAutomation.apply(oscNote.gain.gain, note.sensitivity, noteOffset);
                oscNote.osc.type = oscillator.type.id;
                oscNote.osc.frequency.value = notesFrequency[note.note];

                oscNote.osc.start(this.session.audioEngine.liveTime + noteOffset);
                oscNote.osc.stop(this.session.audioEngine.liveTime + noteEnd);
                this.playingNotes.push(oscNote);
            });
        });
    }
}