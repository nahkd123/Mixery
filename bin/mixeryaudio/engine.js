var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    decodeAudio(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.audio.decodeAudioData(data);
        });
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
    startRender() {
        return __awaiter(this, void 0, void 0, function* () {
            let buffer = yield this.renderer.startRendering();
            this.renderer = undefined;
            return buffer;
        });
    }
    afterRender() {
        this.nodes.forEach(node => node.afterRender());
        this.nodes.forEach(node => node.reconnectAll());
    }
}