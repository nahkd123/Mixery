import { MIDIClip } from "../../../mixerycore/clips.js";
import { AudioGenerator } from "../../../mixerycore/generator.js";
import { PluginPreset } from "../../../mixerycore/plugins.js";
import { Session } from "../../../mixerycore/session.js";
import { GeneratorExplorerContent } from "../../../mixeryui/explorer.js";

export default class OscNodesExplorerContent extends GeneratorExplorerContent {
    name = "OscNodes";

    constructPlugin(preset: PluginPreset) {
        let plugin = new OscNodes();
        return plugin;
    }
}

class OscillatorsType {
    name: string;
    icon: string;
    addIcon: string;

    constructor(name: string, icon: string, addIcon = icon) {
        this.name = name;
        this.icon = icon;
        this.addIcon = addIcon;
    }
}
namespace OscillatorsTypes {
    export const SINE = new OscillatorsType("Sine", "/assets/icons/sinewave.svg", "/assets/icons/add-sinewave.svg");
    export const SQUARE = new OscillatorsType("Square", "/assets/icons/squarewave.svg", "/assets/icons/add-squarewave.svg");

    export const oscillators = [SINE, SQUARE];
}

interface Oscillator {
    name: string;
    type: OscillatorsType;
    semitonesOffset: number;
}

export class OscNodes extends AudioGenerator {
    name = "OscNodes";
    author = ["nahkd123"];

    oscillators: Oscillator[] = [];
    session: Session;
    output: AudioNode;

    oscListing: HTMLDivElement;

    generatorLoad(session: Session, output: AudioNode) {
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
        let osc = {
            name: type.name + " " + (this.oscillators.length + 1),
            type,
            semitonesOffset: 0
        };
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

        element.append(label, toolsbar);
        this.oscListing.append(element);
        return osc;
    }

    playClip(clip: MIDIClip, clipOffset: number) {}
}