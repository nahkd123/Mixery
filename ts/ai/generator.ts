import { MIDINoteInfo } from "../mixerycore/midi";

export interface MusicGeneratorOptions {
    parameters: MusicGeneratorParameterDefinition[];
    hiddenLayers: convnetjs.LayerDefinition[];

    startNote?: number;
    notesCount?: number;
    ticksPerBeat?: number;
    beatsCount?: number;
}
export interface MusicGeneratorParameterDefinition {
    name: string;
}


export class MusicGenerator {
    vis: SubwindowVisualizer;
    network: convnetjs.Net;

    get startNote() {return this.options.startNote || 60;}
    get notesCount() {return this.options.notesCount || 12;}
    get ticksPerBeat() {return this.options.ticksPerBeat || 96;}
    get beatsCount() {return this.options.beatsCount || 4;}
    get ticksCount() {return this.ticksPerBeat * this.beatsCount;}

    constructor(
        public options: MusicGeneratorOptions
    ) {
        this.network = new convnetjs.Net();
        this.network.makeLayers([
            {type: "input", out_sx: 1, out_sy: 1, out_depth: options.parameters.length + 1},
            ...this.options.hiddenLayers,
            //{type: "regression", num_neurons: this.notesCount}
            {type: "softmax", num_classes: this.notesCount}
        ]);
    }

    train(params: number[], midi: MIDINoteInfo[], batchSize = 100) {
        const trainer = new convnetjs.Trainer(this.network, {
            //method: "adadelta",
            l2_decay: 0.001,
            batch_size: batchSize,
            learning_rate: 0.01
        });
        let inputVolume: convnetjs.Vol;

        const self = this;

        for (let tick = 0; tick < this.ticksCount; tick++) {
            const beat = tick / this.ticksPerBeat;
            const t = tick / this.ticksCount;

            inputVolume = new convnetjs.Vol(this.options.parameters.length + 1, 1, 1);
            params.forEach((p, i) => {inputVolume.w[i + 1] = p});
            inputVolume.w[0] = t;

            for (let i = 0; i < midi.length; i++) {
                const note = midi[i];
                if (note.note >= this.startNote && note.note <= this.startNote + this.notesCount && beat >= note.start && beat <= note.start + note.duration) {
                    trainer.train(inputVolume, note.note - this.startNote);
                }
            }
            //trainer.train(inputVolume, 1);
            //if (localIter === 0) console.log(t, outputData);
        }
    }

    apply(params: number[], midi: MIDINoteInfo[]) {
    }
}

export class SubwindowVisualizer {
    window: Window;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor() {
        this.window = window.open("about:blank", "", "o");
        this.window.document.title = "Music Generator vis";

        this.canvas = this.window.document.createElement("canvas");
        this.canvas.width = 500; this.canvas.height = 500;
        this.ctx = this.canvas.getContext("2d");

        this.window.document.body.append(this.canvas);
    }
}