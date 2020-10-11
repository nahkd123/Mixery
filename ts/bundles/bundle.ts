import { AudioClipExplorerContent, EffectExplorerContent, GeneratorExplorerContent } from "../mixeryui/explorer.js";

export default class Bundle {
    name: string;
    author: string;
    version: string;

    // Bundle contents
    generators: GeneratorExplorerContent[] = [];
    effects: EffectExplorerContent[] = [];
    audios: AudioClipExplorerContent[] = [];
}