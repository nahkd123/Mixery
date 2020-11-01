import RenderableAudioParam from "../automations/param.js";
import MixeryAudioEngine from "../engine.js";
import RenderableAudioNode from "./node.js";

export default class RenderableGainNode extends RenderableAudioNode {
    audioNode: GainNode;
    rendererNode: GainNode;

    readonly gain: RenderableAudioParam;

    constructor(engine: MixeryAudioEngine) {
        super(engine);
        this.audioNode = this.audioContext.createGain();
        this.audioNode.gain.value = 1.0;
        this.gain = new RenderableAudioParam(engine);
        this.gain.audioParam = this.audioNode.gain;

        console.log(engine);
        if (this.isRendering) this.beforeRender();
    }

    beforeRender() {
        this.rendererNode = this.renderingContext.createGain();
        this.rendererNode.gain.value = 1.0;
        this.gain.rendererParam = this.rendererNode.gain;
    }

    afterRender() {
        this.rendererNode = undefined;
        this.gain.rendererParam = undefined;
    }
}