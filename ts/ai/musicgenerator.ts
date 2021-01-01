import { Resources } from "../mixerycore/resources.js";

export namespace MusicGenerator {
    export const VERSION = "ml5powered-" + ml5.version + "-1/1/2021";
    export class Generator {
        network: ml5.NeuralNetwork;
        get beatsLength() {return this.options.beatsLength || 1;}
        get notesCount() {return this.options.notesCount || 12;}
        get ticksPerBeat() {return this.options.ticksPerBeat || 96;}

        constructor(
            public options: GeneratorOptions = {}
        ) {
            this.network = ml5.neuralNetwork({
                task: "regression",
                inputs: ["time"],
                outputs: this.notesCount
            });
        }
        addData(data: TrainingData) {
            const ticksSum = this.ticksPerBeat * this.beatsLength;
            for (let i = 0; i < ticksSum; i++) {
                const time = i / ticksSum;
                const beat = i / this.ticksPerBeat;
                const beatEnd = (i + 1) / this.ticksPerBeat;
                const input = {
                    time,
                    ...data.params
                };
                const output = [];
                for (let i = 0; i < this.notesCount; i++) output[i] = 0;
                data.notes.forEach(note => {
                    if (note.offset >= beat && note.offset <= beatEnd) output[note.index] = 1;
                });

                this.network.addData(input, output);
            }
        }
        train(options: ml5.NeuralNetworkTrainOptions) {
            return new Promise<void>((resolve, reject) => {
                this.network.train(options, () => {
                    resolve();
                });
            });
        }

        async forward(options: ForwardRequest) {
            const ticksSum = this.ticksPerBeat * this.beatsLength;
            const output: ForwardResponse = {
                notes: []
            };

            for (let i = 0; i < ticksSum; i++) {
                const time = i / ticksSum;
                const beat = i / this.ticksPerBeat;
                const input = {
                    time,
                    ...options.params
                };
                const nnoutput: {
                    value: number,
                    label: string
                }[] = await this.network.predict(input);
                nnoutput.forEach((vel, i) => {
                    if (vel.value >= (options.confidence || 0.75)) output.notes.push({
                        index: i,
                        offset: beat,
                        velocity: 1
                    });
                });
            }

            return output;
        }

        async forwardToResource(res: Resources.MIDIResource, options: ForwardRequest, convertOpt: ResourceConverterOptions = {}) {
            const startNote = convertOpt.resStartNote || 60;
            const response = await this.forward(options);
            
            response.notes.forEach(note => {
                res.notes.push({
                    note: note.index + startNote,
                    start: note.offset,
                    duration: 0.125,
                    sensitivity: 0.75
                });
            });
        }
    }
    export interface GeneratorOptions {
        /** How many beats to generate/train */
        beatsLength?: number;
        /** How many notes to generate/train */
        notesCount?: number;
        /** How many ticks per beat. Default is 96 */
        ticksPerBeat?: number;
    }

    export interface TrainingData {
        params?: object;
        notes: NoteData[];
    }
    export interface ForwardRequest {
        /** Input parameters */
        params?: object;
        confidence?: number;
    }
    export interface ForwardResponse {
        notes: NoteData[];
    }
    export interface NoteData {
        index: number;
        velocity: number;
        offset: number;
    }
    export interface ResourceConverterOptions {
        resStartNote?: number;
    }
}