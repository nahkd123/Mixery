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
            {type: "regression", num_neurons: this.notesCount}
        ]);
    }

    train(params: number[], midi: MIDINoteInfo[], count = 100) {
        const trainer = new convnetjs.Trainer(this.network, {
            method: "adadelta",
            l2_decay: 0.001,
            batch_size: count
        });
        const inputVolume = new convnetjs.Vol(this.options.parameters.length + 1, 1, 1);
        params.forEach((p, i) => {inputVolume.w[i + 1] = p});

        const outputData = new Float32Array(this.notesCount);
        const self = this;
        function applyToOutput(beat: number) {
            outputData.forEach((v, i) => {outputData[i] = 0;});

            midi.forEach(note => {
                if (
                    (note.note >= self.startNote && note.note <= self.startNote + self.notesCount) &&
                    (beat >= note.start && beat <= note.start + note.duration)
                ) {
                    outputData[note.note - self.startNote] = 1;
                }
            });
        }

        for (let tick = 0; tick < this.ticksCount; tick++) {
            const beat = tick / this.ticksPerBeat;
            const t = tick / this.ticksCount;

            applyToOutput(beat);
            inputVolume.w[0] = t;

            trainer.train(inputVolume, outputData);
            //if (localIter === 0) console.log(t, outputData);
        }

        this.vis?.visualize(params);
    }

    linkVis() {
        this.vis = new SubwindowVisualizer(this);
    }
}

export class SubwindowVisualizer {
    window: Window;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(
        public link: MusicGenerator
    ) {
        this.window = window.open("about:blank", "", "o");
        this.window.document.title = "Music Generator vis";

        this.canvas = this.window.document.createElement("canvas");
        this.canvas.width = 500; this.canvas.height = 500;
        this.ctx = this.canvas.getContext("2d");

        this.window.document.body.append(this.canvas);
    }

    visualize(params: number[]) {
        this.ctx.clearRect(0, 0, 500, 500);

        const noteHeight = 500 / this.link.notesCount;

        const inputVolume = new convnetjs.Vol(this.link.options.parameters.length + 1, 1, 1);
        params.forEach((p, i) => {inputVolume.w[i + 1] = p});

        for (let i = 0; i < 100; i++) {
            inputVolume.w[0] = i / 100;
            const output = this.link.network.forward(inputVolume).w;
            for (let j = 0; j < this.link.notesCount; j++) {
                this.ctx.fillStyle = "rgba(255, 0, 0, " + output[j] + ")";
                this.ctx.fillRect(i * 5, j * noteHeight, 5, noteHeight);
            }
        }
    }
}