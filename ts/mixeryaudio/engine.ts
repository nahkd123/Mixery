import Mixer from "./mixer/mixer.js";
import RenderableAudioBufferSourceNode from "./nodes/audiobuffer.js";
import RenderableDestinationNode from "./nodes/destination.js";
import RenderableGainNode from "./nodes/gain.js";
import RenderableAudioNode from "./nodes/node.js";
import RenderableOscillatorNode from "./nodes/oscillator.js";
import { AudioSampleRates } from "./samplerates.js";

export default class MixeryAudioEngine {
    audio: AudioContext;
    renderer: OfflineAudioContext;
    get liveTime() {return this.renderer === undefined? this.audio.currentTime : this.renderer.currentTime}
    get state() {return this.audio.state;}

    destination: RenderableDestinationNode;
    nodes: RenderableAudioNode[] = [];

    mixer: Mixer;

    constructor() {
        this.audio = new AudioContext();
        this.destination = new RenderableDestinationNode(this);

        this.mixer = new Mixer(this);
    }

    createGain() {return new RenderableGainNode(this);}
    createOscillator() {return new RenderableOscillatorNode(this);}
    createBufferSource(buffer?: AudioBuffer) {
        let source = new RenderableAudioBufferSourceNode(this);
        if (buffer) source.buffer = buffer;
        return source;
    }

    //#region Renderer
    beforeRender() {
        this.nodes.forEach(node => node.beforeRender());
        this.mixer.beforeRender();
    }

    prepareRenderer(length: number, sampleRate = AudioSampleRates.COMMON) {
        this.renderer = new OfflineAudioContext({
            length,
            sampleRate
        });
        this.beforeRender();
    }

    async startRender() {
        let buffer = await this.renderer.startRendering();
        // We'll add encoding thing in here soon...
        return buffer;
    }
    //#endregion
}