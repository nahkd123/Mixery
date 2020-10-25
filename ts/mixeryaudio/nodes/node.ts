import RenderableAudioParam from "../automations/param.js";
import MixeryAudioEngine from "../engine.js";

export default abstract class RenderableAudioNode {
    engine: MixeryAudioEngine;
    get isRendering() {return this.engine.renderer !== undefined;}
    get audioContext() {return this.engine.audio;}
    get renderingContext() {return this.engine.renderer;}

    abstract audioNode: AudioNode;
    abstract rendererNode: AudioNode;

    constructor(engine: MixeryAudioEngine) {
        this.engine = engine;
        engine.nodes.push(this);
    }

    abstract beforeRender();

    connect(node: RenderableAudioNode) {
        if (node.engine !== this.engine) throw "Audio engine does not match";

        this.audioNode.connect(node.audioNode);
        if (this.isRendering) this.rendererNode.connect(node.rendererNode);
    }

    connectParam(param: RenderableAudioParam) {
        this.audioNode.connect(param.audioParam);
        if (this.isRendering) this.audioNode.connect(param.rendererParam);
    }

    disconnect(node?: RenderableAudioNode) {
        this.audioNode.disconnect(node !== undefined? node.audioNode : undefined);
        if (this.isRendering) this.rendererNode.disconnect(node !== undefined? node.rendererNode : undefined);
    }
}