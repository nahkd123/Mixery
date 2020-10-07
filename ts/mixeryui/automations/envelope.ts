export default class AudioEnvelope {
    type: TimingType;

    delayTime: number;

    attackTime: number;

    decayTime: number;
    decayTo: number;

    sustainTime: number;
    sustainTo: number;

    releaseTime: number;

    constructor(timing: TimingType = "bpm", dt = 0, at = 0.05, dcti = 0.5, dcto = 0.75, sti = 1, sto = 0.5, rt = 0.15) {
        this.type = timing;

        this.delayTime = dt;
        this.attackTime = at;
        this.decayTime = dcti;
        this.decayTime = dcto;
        this.sustainTime = sti;
        this.sustainTo = sto;
        this.releaseTime = rt;
    }
    
    apply() {}
}