import Bundle from "../bundle.js";
import OscNodesExplorerContent from "./generators/oscnodes.js";

export default class MixeryDefaultBundle extends Bundle {
    name = "Mixery Default Bundle";
    author = "nahkd123";
    version = "2020";

    constructor() {
        super();

        // Generators
        this.generators.push(new OscNodesExplorerContent());
    }
}