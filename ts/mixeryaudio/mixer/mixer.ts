import MixeryAudioEngine from "../engine.js";
import MixerTrack from "./track.js";

export default class Mixer {
    engine: MixeryAudioEngine;
    tracks: MixerTrack[] = [];
    master: MixerTrack;

    constructor(engine: MixeryAudioEngine) {
        this.engine = engine;

        this.master = this.addTrack("Master");
        this.master.output.connect(engine.destination);
    }

    beforeRender() {
        this.reconnectTracks();
    }

    addTrack(name?: string) {
        let track = new MixerTrack(this, name);
        this.tracks.push(track);
        if (this.master !== undefined) track.output.connect(this.master.input);
        return track;
    }

    reconnectTracks() {
        this.tracks.forEach(track => {
            track.output.disconnect();
            track.output.connect(this.master.input);
        });

        this.master.output.connect(this.engine.destination);
    }
}