import { MIDINoteInfo } from "../mixerycore/midi.js";
import { SubwindowVisualizer } from "./generator.js";

export class MapBasedMusicGenerator {
    network: convnetjs.Net;

    get mapRows() {return this.options.mapRows || 12;}
    get paramsCount() {return this.options.paramsCount || 0;}
    get trainingLocalIter() {return this.options.trainingLocalIter || 96;}

    constructor(
        public options: MapBasedMusicGeneratorOptions = {}
    ) {
        this.network = new convnetjs.Net();
        let layers: convnetjs.LayerDefinition[] = [
            {type: "input", out_sx: this.paramsCount + 1, out_sy: 1, out_depth: 1},
            {type: "fc", num_neurons: 20, activation: "sigmoid"},
            {type: "fc", num_neurons: 20, activation: "sigmoid"},
            {type: "regression", num_neurons: this.mapRows}
        ];
        this.network.makeLayers(layers);
    }

    train(data: MapBasedMusicGeneratorTrainingData) {
        let trainer = new convnetjs.Trainer(this.network, {
            learning_rate: 0.01,
            l2_decay: 0.00001,
            batch_size: 10
        });

        for (let i = 0; i < this.trainingLocalIter; i++) {
            const time = (i + 1) / this.trainingLocalIter;
            let inputVolume = new convnetjs.Vol(this.paramsCount + 1, 1, 1);
            inputVolume.w[0] = time;
            let outputArray = [];
            for (let j = 0; j < this.mapRows; j++) outputArray[j] = 0;
            data.notes.forEach(note => {
                if (note.timeStart >= time && note.timeEnd <= time) outputArray[note.rowIndex] = 0.8;
            });
            trainer.train(inputVolume, outputArray);
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const rowHeight = height / this.mapRows;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "red";

        for (let i = 0; i < width; i++) {
            let inputVolume = new convnetjs.Vol(this.paramsCount + 1, 1, 1);
            inputVolume.w[0] = i / width;
            let outputVolume = this.network.forward(inputVolume);

            for (let row = 0; row < this.mapRows; row++) {
                ctx.globalAlpha = outputVolume.w[row];
                ctx.fillRect(i, row * rowHeight, 1, rowHeight);
                ctx.globalAlpha = 1;
            }
        }
    }

    drawOnNewWindow() {
        let win = new SubwindowVisualizer();
        this.draw(win.ctx);
    }

    rtTraining(data: MapBasedMusicGeneratorTrainingData) {
        let win = new SubwindowVisualizer();
        setInterval(() => {
            this.train(data);
            this.draw(win.ctx);
        }, 20);
    }
}

export class MapBasedMusicGeneratorOptions {
    mapRows?: number;
    paramsCount?: number;
    trainingLocalIter?: number;
}

export class MapBasedMusicGeneratorTrainingData {
    params: number[];
    notes: MapBasedMusicGeneratorNote[];
}

export class MapBasedMusicGeneratorNote {
    timeStart: number;
    timeEnd: number;
    rowIndex: number;
}