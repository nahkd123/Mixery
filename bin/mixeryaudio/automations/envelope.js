import { beatsToMS, msToBeats } from "../../utils/msbeats.js";
export default class EnvelopeAutomation {
    constructor(attackTime = 0, decayTime = 0, decayTo = 1, releaseTime = 0) {
        this.enabled = false;
        this.unit = "seconds";
        this.attackTime = attackTime;
        this.decayTime = decayTime;
        this.decayTo = decayTo;
        this.releaseTime = releaseTime;
    }
    measureNoteTimeInMS(ms, bpm = 120) {
        if (!this.enabled)
            return ms;
        switch (this.unit) {
            case "seconds": return ms + this.releaseTime;
            case "bpm": return ms + beatsToMS(this.releaseTime, bpm);
            default: return 0;
        }
    }
    measureNoteTimeInBeats(beats, bpm = 120) {
        if (!this.enabled)
            return beats;
        switch (this.unit) {
            case "seconds": return beats + msToBeats(this.releaseTime, bpm);
            case "bpm": return beats + this.releaseTime;
            default: return 0;
        }
    }
    /**
     * Apply envelope
     * @param param The audio param to apply
     * @param noteLength The duration of the note in ms, or -1/Infinity for infinite note duration
     * @param bpm The current BPM
     * @param mul Multiplier
     * @param offset Start offset in ms
     */
    applyNoteInMS(param, noteLength, bpm = 120, mul = 1.0, offset = 0) {
        if (!this.enabled || noteLength === 0) {
            param.value = mul;
            return;
        }
        let atk, decay, decayTo, release; // In ms
        if (this.unit === "seconds") {
            atk = this.attackTime;
            decay = this.decayTime;
            decayTo = this.decayTo;
            release = this.releaseTime;
        }
        else if (this.unit === "bpm") {
            atk = beatsToMS(this.attackTime, bpm);
            decay = beatsToMS(this.decayTime, bpm);
            decayTo = beatsToMS(this.decayTo, bpm);
            release = beatsToMS(this.releaseTime, bpm);
        }
        if (noteLength === -1) {
            param.linearRampToValueAtNextTime(offset / 1000, 0);
            param.linearRampToValueAtNextTime((offset + atk) / 1000, mul);
            param.linearRampToValueAtNextTime((offset + atk + decay) / 1000, decayTo * mul);
            return;
        }
        if (atk > 0)
            param.linearRampToValueAtNextTime(offset / 1000, 0);
        if (noteLength < atk) {
            param.linearRampToValueAtNextTime((offset + noteLength) / 1000, (noteLength / atk) * mul);
            param.linearRampToValueAtNextTime((offset + noteLength + release) / 1000, 0);
            return;
        }
        param.linearRampToValueAtNextTime((offset + atk) / 1000, mul);
        if (noteLength < atk + decay) {
            param.linearRampToValueAtNextTime((offset + noteLength) / 1000, decayTo + ((1 - decayTo) * (1 - (noteLength - atk) / decay)) * mul);
            param.linearRampToValueAtNextTime((offset + noteLength + release) / 1000, 0);
            return;
        }
        param.linearRampToValueAtNextTime((offset + atk + decay) / 1000, decayTo * mul);
        param.linearRampToValueAtNextTime((offset + noteLength) / 1000, decayTo * mul);
        param.linearRampToValueAtNextTime((offset + noteLength + release) / 1000, 0);
    }
}