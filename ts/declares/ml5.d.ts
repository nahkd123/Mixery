declare namespace ml5 {
    function neuralNetwork(
        options: NeuralNetworkOptions,
        loaded?: () => void
    ): NeuralNetwork;
    interface NeuralNetwork {
        isTrained: boolean;
        isCompiled: boolean;
        isLayered: boolean;
        model: tf.Sequential;

        init(): void;
        createModel(type?: "sequential"): tf.Sequential;
        addLayer(options: {}): void;
        compile(options: {}): void;
        setOptimizerFunction(learningRate: number, optimizer: (learningRate: number) => any): any;
        train(options: NeuralNetworkTrainOptions, cb: () => void): any;
        trainInternal(options: NeuralNetworkTrainOptions): Promise<void>;
        predict(inputs): Promise<any>;

        save(name?: string, cb?: () => void): Promise<any>;
        save(cb?: () => void): Promise<any>;
        load(files?: FileList, cb?: () => void): Promise<any>;
        load(files?: object, cb?: () => void): Promise<any>;
        load(files?: string, cb?: () => void): Promise<any>;
        dispose(): void;

        addData(input: object, output: object): void;
    }
    interface NeuralNetworkOptions {
        task: "classification" | "regression" | "imageClassification";
        debug?: boolean;

        dataUrl?: string;
        inputs?: number | string[] | number[];
        outputs?: number | string[] | number[];
    }
    interface NeuralNetworkTrainOptions {
        epochs: number;
        batchSize: number;
    }

    const version: string;
}