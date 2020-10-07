import MixeryAudioEngine from "../engine.js";
import RenderableGainNode from "../nodes/gain.js";
import MixerTrackEffect from "./effect.js";
import Mixer from "./mixer.js";

export default class MixerTrack {
    mixer: Mixer;
    engine: MixeryAudioEngine;

    name: string;
    color: string[] = ["#ccbbef", "black"];

    // output <- effects <- inputs
    output: RenderableGainNode;
    effects: MixerTrackEffect[] = [];
    input: RenderableGainNode;

    get gain() {return this.output.gain;}

    constructor(mixer: Mixer, name = "Track " + mixer.tracks.length) {
        this.mixer = mixer;
        this.engine = mixer.engine;

        this.name = name;

        this.output = this.engine.createGain();
        this.input = this.engine.createGain();
        this.reconnectEffects();
    }

    add(effect: MixerTrackEffect) {
        this.effects.push(effect);
        this.reconnectEffects();
    }

    reconnectEffects() {
        this.effects.forEach(effect => {
            effect.input.disconnect();
            effect.output.disconnect();
        });

        let currentOutput = this.output;
        this.effects.forEach(effect => {
            effect.output.connect(currentOutput);
            currentOutput = effect.input;
        });
        this.input.connect(currentOutput);
    }
}