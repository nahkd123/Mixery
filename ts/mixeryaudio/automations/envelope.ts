import { beatsToMS, msToBeats } from "../../utils/msbeats.js";
import RenderableAudioParam from "./param.js";

export default class EnvelopeAutomation {
    unit: TimingType;
    enabled = false;

    attackTime: number;
    holdTime: number;
    holdTo: number;
    decayTime: number;

    constructor(attackTime = 0, holdTime = 0, holdTo = 1, decayTime = 0) {
        this.unit = "seconds";
        this.attackTime = attackTime;
        this.holdTime = holdTime;
        this.holdTo = holdTo;
        this.decayTime = decayTime;
    }

    measureNoteTimeInMS(ms: number, bpm: number = 120) {
        switch (this.unit) {
            case "seconds": return ms + this.decayTime;
            case "bpm":     return ms + beatsToMS(this.decayTime, bpm);
            default:        return 0;
        }
    }

    measureNoteTimeInBeats(beats: number, bpm: number = 120) {
        switch (this.unit) {
            case "seconds": return beats + msToBeats(this.decayTime, bpm);
            case "bpm":     return beats + this.decayTime;
            default:        return 0;
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
    applyNoteInMS(param: RenderableAudioParam, noteLength: number, bpm: number = 120, mul = 1.0, offset: number = 0) {
        if (!this.enabled || noteLength === 0) return;

        let atk, hold, holdTo, decay: number; // In ms
        if (this.unit === "seconds") {
            atk     = this.attackTime;
            hold    = this.holdTime;
            holdTo  = this.holdTo;
            decay   = this.decayTime;
        } else if (this.unit === "bpm") {
            atk     = beatsToMS(this.attackTime, bpm);
            hold    = beatsToMS(this.holdTime, bpm);
            holdTo  = beatsToMS(this.holdTo, bpm);
            decay   = beatsToMS(this.decayTime, bpm);
        }

        if (noteLength === -1) {
            param.linearRampToValueAtNextTime(offset / 1000, 0);
            param.linearRampToValueAtNextTime((offset + atk) / 1000, mul);
            param.linearRampToValueAtNextTime((offset + atk + hold) / 1000, holdTo * mul);
            return;
        }

        if (atk > 0) param.linearRampToValueAtNextTime(offset / 1000, 0);
        if (noteLength < atk) {
            param.linearRampToValueAtNextTime((offset + noteLength) / 1000, (noteLength / atk) * mul);
            param.linearRampToValueAtNextTime((offset + noteLength + decay) / 1000, 0);
            return;
        }
        param.linearRampToValueAtNextTime((offset + atk) / 1000, mul);
        if (noteLength < atk + hold) {
            param.linearRampToValueAtNextTime((offset + noteLength) / 1000, holdTo + ((1 - holdTo) * (1 - (noteLength - atk) / hold)) * mul);
            param.linearRampToValueAtNextTime((offset + noteLength + decay) / 1000, 0);
            return;
        }
        param.linearRampToValueAtNextTime((offset + atk + hold) / 1000, holdTo * mul);
        param.linearRampToValueAtNextTime((offset + noteLength) / 1000, mul);
        param.linearRampToValueAtNextTime((offset + noteLength + decay) / 1000, 0);
    }
}