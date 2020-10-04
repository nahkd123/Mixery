import MixeryCanvasEngine from "./engine";

export default class AudioMixer {
    engine: MixeryCanvasEngine;
    master: MixerTrack;
    tracks: MixerTrack[] = [];

    constructor(engine: MixeryCanvasEngine) {
        this.engine = engine;

        this.master = new MixerTrack(this);
        this.tracks.push(this.master);
    }

    addTrack() {
        let track = new MixerTrack(this);
        track.gain.connect(this.master.gain);
        return track;
    }

    removeTrack(track: MixerTrack) {
        let index = this.tracks.indexOf(track);
        this.tracks[index].gain.disconnect();
        this.tracks.splice(index, 1);
    }

    refresh() {
        this.tracks.forEach(track => track.reconnectEffectNodes());
    }
}

export class MixerTrack {
    mixer: AudioMixer;
    gain: GainNode; // The output
    effects: EffectNode[] = [];
    input: GainNode; // Generators plugins will use this node

    // Routing
    connectedMaster = true; // Also leave this for now...
    connectedTracks: MixerTrack[] = []; // Leave this for now...

    constructor(mixer: AudioMixer) {
        this.mixer = mixer;
        this.gain = mixer.engine.createGain();
        this.gain.gain.value = 1.0;
    }

    addEffectNode(cb?: (node: EffectNode) => void) {
        let node = new EffectNode(this);
        if (cb !== undefined) cb(node);

        let lastNode = this.effects.length > 0? this.effects[this.effects.length - 1].input : this.gain;
        node.output.connect(lastNode);
        this.input.disconnect();
        this.input.connect(node.input);
        return node;
    }

    removeEffectNode(node: EffectNode) {
        let index = this.effects.indexOf(node);
        this.effects.splice(index, 1);
        
        node.input.disconnect();
        node.output.disconnect();

        this.reconnectEffectNodes(); // We'll implement a better way in one day
    }

    reconnectEffectNodes() {
        this.input.disconnect();

        let lastNode = this.gain;
        this.effects.forEach(eff => {
            eff.input.disconnect();
            eff.output.disconnect();
        });
        this.effects.forEach(eff => {
            eff.output.connect(lastNode);
            lastNode = eff.input;
        });
        this.input.connect(lastNode);
    }
}

export class EffectNode {
    input: GainNode;
    output: GainNode;

    constructor(track: MixerTrack) {
        this.input = track.mixer.engine.createGain();
    }
}