import Bundle from "../bundle.js";
import EQExplorerContent from "./effects/eq.js";
import CheapPianoExplorerContent from "./generators/cheappiano.js";
import DrumPadExplorerContent from "./generators/drumpad.js";
import OscNodesExplorerContent from "./generators/oscnodes.js";
import SamplesMapExplorerContent from "./generators/samplesmap.js";
export default class MixeryDefaultBundle extends Bundle {
    constructor() {
        super();
        this.name = "Mixery Default Bundle";
        this.author = "nahkd123";
        this.version = "2020";
        this.generators.push(new OscNodesExplorerContent(), new SamplesMapExplorerContent(), new CheapPianoExplorerContent(), new DrumPadExplorerContent());
        this.effects.push(new EQExplorerContent());
    }
}