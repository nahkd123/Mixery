import RenderableAudioParam from "../automations/param.js";
import MixeryAudioEngine from "../engine.js";
import RenderableAudioNode from "./node.js";

export default class RenderableAudioBufferSourceNode extends RenderableAudioNode {
    audioNode: AudioBufferSourceNode;
    rendererNode: AudioBufferSourceNode;

    readonly detune: RenderableAudioParam;

    constructor(engine: MixeryAudioEngine) {
        super(engine);

        this.audioNode = engine.audio.createBufferSource();

        this.detune = new RenderableAudioParam(engine);
        this.detune.audioParam = this.audioNode.detune;
    }

    get buffer() {return this.audioNode.buffer;}
    set buffer(val: AudioBuffer) {
        this.audioNode.buffer = val;
        if (this.isRendering) this.rendererNode.buffer = val;
    }

    beforeRender() {
        this.rendererNode = this.engine.renderer.createBufferSource();
        this.detune.rendererParam = this.rendererNode.detune;
    }

    /**
     * Play the audio buffer
     * @param when When the sound should play, based on AudioContext time coordinate
     * @param offset The audio offset in seconds. Ex: to play last 3 seconds of the buffer, offset should
     * be (bufferDuration - 3)
     * @param duration The duration to play, in seconds
     */
    start(when?: number, offset?: number, duration?: number) {
        this.audioNode.start(when, offset, duration);
        if (this.isRendering) this.rendererNode.start(when, offset, duration);
    }

    stop(when?: number) {
        this.audioNode.stop(when);
        if (this.isRendering) this.rendererNode.stop(when);
    }
}