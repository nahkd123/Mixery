import { AudioClipExplorerContent } from "../../mixeryui/explorer.js";
import Bundle from "../bundle.js";
export default class MemesBundle extends Bundle {
    constructor() {
        super();
        this.name = "Memes Bundle";
        this.author = "Internet";
        this.version = "no";
        this.audios.push(new AudioClipExplorerContent("Taco Bell SFX", "../assets/bundles/memes/taco-bell.mp3"));
    }
}