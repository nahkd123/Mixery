import AudioMixer, { MixerTrack } from "./mixer.js";

export default class MixeryCanvasEngine {
    ctx: AudioContext;
    offlineCtx: OfflineAudioContext;
    get rendering() {return this.offlineCtx !== undefined;}

    mixer: AudioMixer;
    get master() {return this.mixer.master;}

    constructor() {
        this.ctx = new AudioContext({latencyHint: "interactive"});
        this.mixer = new AudioMixer(this);

        // Connect audio wee
        this.prepareMixer(this.ctx);

        let self = this;
        function gestrueDetector() {
            self.ctx.resume();
            document.removeEventListener("mousedown", gestrueDetector);
        }
        document.addEventListener("mousedown", gestrueDetector);
    }

    prepareMixer(ctx: AudioContext | OfflineAudioContext) {
        this.master.gain.connect(ctx.destination);
    }

    // Audio context thing
    createGain() {
        return this.ctx.createGain();
    }
}