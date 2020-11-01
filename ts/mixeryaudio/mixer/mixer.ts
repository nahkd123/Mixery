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

    afterRender() {
        this.reconnectTracks();
    }

    addTrack(name?: string) {
        let track = new MixerTrack(this, name);
        this.tracks.push(track);
        if (this.master !== undefined) track.output.connect(this.master.input);
        return track;
    }

    removeTrack(track: MixerTrack) {
        if (track.mixer !== this) throw "Wrong mixer";
        let index = this.tracks.indexOf(track);
        if (index === -1) throw "Unlinked mixer";

        track.output.disconnect();
        this.tracks.splice(index, 1);
    }

    reconnectTracks() {
        this.tracks.forEach(track => {
            track.output.disconnect();
            track.output.connect(this.master.input);
        });

        this.master.output.connect(this.engine.destination);
    }
}