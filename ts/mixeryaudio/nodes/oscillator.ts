import RenderableAudioParam from "../automations/param.js";
import MixeryAudioEngine from "../engine.js";
import RenderableAudioNode from "./node.js";

export default class RenderableOscillatorNode extends RenderableAudioNode {
    audioNode: OscillatorNode;
    rendererNode: OscillatorNode;

    readonly frequency: RenderableAudioParam;
    readonly detune: RenderableAudioParam;
    get type() {return this.audioNode.type;}
    set type(val: OscillatorType) {
        this.audioNode.type = val;
        if (this.isRendering) this.rendererNode.type = val;
    }

    constructor(engine: MixeryAudioEngine) {
        super(engine);

        this.audioNode = this.audioContext.createOscillator();
        this.frequency = new RenderableAudioParam(engine);
        this.frequency.audioParam = this.audioNode.frequency;

        this.detune = new RenderableAudioParam(engine);
        this.detune.audioParam = this.audioNode.detune;

        if (this.isRendering) this.beforeRender();
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

    start(time: number) {
        if (this.isRendering) this.rendererNode.start(time);
        else this.audioNode.start(time);
    }
    stop(time: number) {
        if (this.isRendering) this.rendererNode.stop(time);
        else this.audioNode.stop(time);
    }
}