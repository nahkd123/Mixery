import { AudioClipExplorerContent } from "../../mixeryui/explorer.js";
import Bundle from "../bundle.js";
import EQExplorerContent from "./effects/eq.js";
import CheapPianoExplorerContent from "./generators/cheappiano.js";
import OscNodesExplorerContent from "./generators/oscnodes.js";
import SamplesMapExplorerContent from "./generators/samplesmap.js";

export default class MixeryDefaultBundle extends Bundle {
    name = "Mixery Default Bundle";
    author = "nahkd123";
    version = "2020";

    constructor() {
        super();

        // Generators
        this.generators.push(
            new OscNodesExplorerContent(),
            new SamplesMapExplorerContent(),
            new CheapPianoExplorerContent()
        );

        // Effects
        this.effects.push(new EQExplorerContent());

        // Audios
    }
}