import { AudioClipExplorerContent } from "../../mixeryui/explorer.js";
import Bundle from "../bundle.js";

export default class MemesBundle extends Bundle {
    name = "Memes Bundle";
    author = "Internet";
    version = "no";

    constructor() {
        super();

        // SFX
        this.audios.push(new AudioClipExplorerContent("Taco Bell SFX", "/assets/bundles/memes/taco-bell.mp3"));
    }
}