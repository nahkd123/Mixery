import MixeryAudioEngine from "../engine.js";
import RenderableAudioNode from "./node.js";

export default class RenderableDestinationNode extends RenderableAudioNode {
    audioNode: AudioDestinationNode;
    rendererNode: AudioDestinationNode;

    constructor(engine: MixeryAudioEngine) {
        super(engine);
        this.audioNode = engine.audio.destination;

        if (this.isRendering) this.beforeRender();
    }

    beforeRender() {
        this.rendererNode = this.engine.renderer.destination;
    }

    afterRender() {
        this.rendererNode = undefined;
    }
}