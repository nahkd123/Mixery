import RenderableAudioNode from "./node.js";
export default class RenderableDestinationNode extends RenderableAudioNode {
    constructor(engine) {
        super(engine);
        this.audioNode = engine.audio.destination;
        if (this.isRendering)
            this.beforeRender();
    }
    beforeRender() {
        this.rendererNode = this.engine.renderer.destination;
    }
    afterRender() {
        this.rendererNode = undefined;
    }
}