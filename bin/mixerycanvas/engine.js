import AudioMixer from "./mixer.js";
export default class MixeryCanvasEngine {
    constructor() {
        this.ctx = new AudioContext({ latencyHint: "interactive" });
        this.mixer = new AudioMixer(this);
        this.prepareMixer(this.ctx);
        let self = this;
        function gestrueDetector() {
            self.ctx.resume();
            document.removeEventListener("mousedown", gestrueDetector);
        }
        document.addEventListener("mousedown", gestrueDetector);
    }
    get rendering() { return this.offlineCtx !== undefined; }
    get master() { return this.mixer.master; }
    get liveTime() { return this.ctx.currentTime; }
    prepareMixer(ctx) {
        this.master.gain.connect(ctx.destination);
    }
    createGain() {
        return this.ctx.createGain();
    }
    createOscillator() {
        return this.ctx.createOscillator();
    }
}