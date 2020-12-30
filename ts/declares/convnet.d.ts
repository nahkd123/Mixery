declare namespace convnetjs {
    export const REVISION: string;

    export interface LayerDefinition {
        type: "input" | "fc" | "conv" | "pooling" | "softmax" | "svm" | "regression";

        out_sx?: number;
        out_sy?: number;
        out_depth?: number;

        num_neurons?: number;
        activation?: "sigmoid" | "tanh" | "relu" | "maxout";

        sx?: number;
        filters?: number;
        stride?: number;

        num_classes?: number;
    }
    export class Net {
        makeLayers(
            layerDefs: LayerDefinition[]
        );
        toJSON(): object;
        fromJSON(obj: object);

        forward(
            vol: Vol
        ): Vol;
    }

    export interface TrainerOptions {
        method?: "adadelta" | "adagrad" | "sgd";
        
        learning_rate?: number;
        l1_decay?: number;
        l2_decay?: number;
        momentum?: number;
        batch_size?: number;
    }
    export class Trainer {
        constructor(
            net: Net,
            options: TrainerOptions
        );
        train(vol: Vol, clss: number);
        train(vol: Vol, nr: ArrayLike<number>);
    }
    export class Vol {
        constructor(
            x: number,
            y: number,
            z: number,
            def?: number
        );
        constructor(
            def: number[]
        );

        w: number[];
        dw: number[];

        set(
            x: number,
            y: number,
            z: number,
            value: number
        );
        get(
            x: number,
            y: number,
            z: number
        );
    }
}