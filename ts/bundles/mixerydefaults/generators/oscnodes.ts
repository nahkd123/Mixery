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
    iconPath: string;

    constructor(name: string, icon: string) {
        this.name = name;
        this.iconPath = icon;
    }
}
namespace OscillatorsTypes {
    export const SINE = new OscillatorsType("Sine", "/assets/icons/add-sinewave.svg");
    export const SQUARE = new OscillatorsType("Square", "/assets/icons/add-squarewave.svg");

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
            addButton.style.webkitMaskImage = "url(\"" + oscType.iconPath + "\")";
            addButton.style.maskImage = "url(\"" + oscType.iconPath + "\")";
        });

        window.innerElement.appendChild(toolsBar);
    }

    addOscillator(type: OscillatorsType) {
        let osc = {
            name: type.name + " " + (this.oscillators.length + 1),
            type,
            semitonesOffset: 0
        };
        this.oscillators.push(osc);
        return osc;
    }

    playClip(clip: MIDIClip, clipOffset: number) {}
}