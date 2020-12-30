export interface BitmapNNOptions {
    width: number;
    height: number;
    params?: number;
}

export class BitmapNN {
    width: number;
    height: number;
    params: number;

    network: convnetjs.Net;

    get area() {return this.width * this.height;}

    constructor(width: number, height: number);
    constructor(options: BitmapNNOptions);
    constructor(a: number | BitmapNNOptions, b?: number) {
        if (typeof a === "number") {
            this.width = a;
            this.height = a;
            this.params = 0;
        } else {
            this.width = a.width;
            this.height = a.height;
            this.params = a.params || 0;
        }

        this.network = new convnetjs.Net();
        let layers: convnetjs.LayerDefinition[] = [
            {type: "input", out_sx: this.params, out_sy: 1, out_depth: 1},
            {type: "fc", num_neurons: 20, activation: "sigmoid"},
            {type: "fc", num_neurons: 20, activation: "sigmoid"},
            {type: "regression", num_classes: this.area}
        ];
        this.network.makeLayers(layers);
    }

    train(params: number[], map: number[]) {
        let inputVolume = new convnetjs.Vol(params);
        let trainer = new convnetjs.Trainer(this.network, {
            learning_rate: 0.01,
            l2_decay: 0.001,
            batch_size: 1
        });

        return trainer.train(inputVolume, map);
    }

    visualize(params: number[], ctx: CanvasRenderingContext2D) {
        const inputVolume = new convnetjs.Vol(params);

        ctx.clearRect(0, 0, this.width * 16, this.height * 16);
        ctx.fillStyle = "black";
        const outputVolume = this.network.forward(inputVolume);
        for (let y = 0; y < this.height; y++)
        for (let x = 0; x < this.width; x++) {
            ctx.globalAlpha = outputVolume.w[y * this.width + x];
            ctx.fillRect(x * 16, y * 16, 15, 15);
            ctx.globalAlpha = 1;
        }
    }
}