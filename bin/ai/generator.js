export class MusicGenerator {
    constructor(options) {
        this.options = options;
        this.network = new convnetjs.Net();
        this.network.makeLayers([
            { type: "input", out_sx: 1, out_sy: 1, out_depth: options.parameters.length + 1 },
            ...this.options.hiddenLayers,
            { type: "softmax", num_classes: this.notesCount }
        ]);
    }
    get startNote() { return this.options.startNote || 60; }
    get notesCount() { return this.options.notesCount || 12; }
    get ticksPerBeat() { return this.options.ticksPerBeat || 96; }
    get beatsCount() { return this.options.beatsCount || 4; }
    get ticksCount() { return this.ticksPerBeat * this.beatsCount; }
    train(params, midi, batchSize = 100) {
        const trainer = new convnetjs.Trainer(this.network, {
            l2_decay: 0.001,
            batch_size: batchSize,
            learning_rate: 0.01
        });
        let inputVolume;
        const self = this;
        for (let tick = 0; tick < this.ticksCount; tick++) {
            const beat = tick / this.ticksPerBeat;
            const t = tick / this.ticksCount;
            inputVolume = new convnetjs.Vol(this.options.parameters.length + 1, 1, 1);
            params.forEach((p, i) => { inputVolume.w[i + 1] = p; });
            inputVolume.w[0] = t;
            for (let i = 0; i < midi.length; i++) {
                const note = midi[i];
                if (note.note >= this.startNote && note.note <= this.startNote + this.notesCount && beat >= note.start && beat <= note.start + note.duration) {
                    trainer.train(inputVolume, note.note - this.startNote);
                }
            }
        }
    }
    apply(params, midi) {
    }
}
export class SubwindowVisualizer {
    constructor() {
        this.window = window.open("about:blank", "", "o");
        this.window.document.title = "Music Generator vis";
        this.canvas = this.window.document.createElement("canvas");
        this.canvas.width = 500;
        this.canvas.height = 500;
        this.ctx = this.canvas.getContext("2d");
        this.window.document.body.append(this.canvas);
    }
}