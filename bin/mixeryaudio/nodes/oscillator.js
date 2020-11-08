import RenderableAudioParam from "../automations/param.js";
import RenderableAudioNode from "./node.js";
export default class RenderableOscillatorNode extends RenderableAudioNode {
    constructor(engine) {
        super(engine);
        this.audioNode = this.audioContext.createOscillator();
        this.frequency = new RenderableAudioParam(engine);
        this.frequency.audioParam = this.audioNode.frequency;
        this.detune = new RenderableAudioParam(engine);
        this.detune.audioParam = this.audioNode.detune;
        if (this.isRendering)
            this.beforeRender();
    }
    get type() { return this.audioNode.type; }
    set type(val) {
        this.audioNode.type = val;
        if (this.isRendering)
            this.rendererNode.type = val;
    }
    beforeRender() {
        this.rendererNode = this.audioContext.createOscillator();
        this.frequency.rendererParam = this.rendererNode.frequency;
        this.detune.rendererParam = this.rendererNode.frequency;
    }
    afterRender() {
        this.rendererNode = undefined;
        this.frequency.rendererParam = undefined;
        this.detune.rendererParam = undefined;
    }
    start(time) {
        if (this.isRendering)
            this.rendererNode.start(time);
        else
            this.audioNode.start(time);
    }
    stop(time) {
        if (this.isRendering)
            this.rendererNode.stop(time);
        else
            this.audioNode.stop(time);
    }
}