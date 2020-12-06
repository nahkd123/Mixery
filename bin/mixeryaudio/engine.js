import Mixer from "./mixer/mixer.js";
import RenderableAudioBufferSourceNode from "./nodes/audiobuffer.js";
import RenderableDestinationNode from "./nodes/destination.js";
import RenderableGainNode from "./nodes/gain.js";
import RenderableOscillatorNode from "./nodes/oscillator.js";
import { AudioSampleRates } from "./samplerates.js";
export default class MixeryAudioEngine {
    constructor() {
        this.nodes = [];
        this.audio = new AudioContext();
        this.destination = new RenderableDestinationNode(this);
        this.mixer = new Mixer(this);
    }
    get liveTime() { return this.renderer === undefined ? this.audio.currentTime : this.renderer.currentTime; }
    get state() { return this.audio.state; }
    createGain() { return new RenderableGainNode(this); }
    createOscillator() { return new RenderableOscillatorNode(this); }
    createBufferSource(buffer) {
        let source = new RenderableAudioBufferSourceNode(this);
        if (buffer)
            source.buffer = buffer;
        return source;
    }
    async decodeAudio(data) {
        return this.audio.decodeAudioData(data);
    }
    beforeRender() {
        this.nodes.forEach(node => node.beforeRender());
        this.nodes.forEach(node => node.reconnectAll());
    }
    prepareRenderer(length, channels = 2, sampleRate = AudioSampleRates.COMMON) {
        this.renderer = new OfflineAudioContext({
            length,
            sampleRate,
            numberOfChannels: channels
        });
        this.beforeRender();
    }
    async startRender() {
        let buffer = await this.renderer.startRendering();
        this.renderer = undefined;
        return buffer;
    }
    afterRender() {
        this.nodes.forEach(node => node.afterRender());
        this.nodes.forEach(node => node.reconnectAll());
    }
}