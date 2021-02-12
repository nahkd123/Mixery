export var MusicGenerator;
(function (MusicGenerator) {
    MusicGenerator.VERSION = "ml5powered-" + ml5.version + "-1/1/2021";
    class Generator {
        constructor(options = {}) {
            this.options = options;
            this.network = ml5.neuralNetwork({
                task: "regression",
                inputs: ["time"],
                outputs: this.notesCount
            });
        }
        get beatsLength() { return this.options.beatsLength || 1; }
        get notesCount() { return this.options.notesCount || 12; }
        get ticksPerBeat() { return this.options.ticksPerBeat || 96; }
        addData(data) {
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
                for (let i = 0; i < this.notesCount; i++)
                    output[i] = 0;
                data.notes.forEach(note => {
                    if (note.offset >= beat && note.offset <= beatEnd)
                        output[note.index] = 1;
                });
                this.network.addData(input, output);
            }
        }
        train(options) {
            return new Promise((resolve, reject) => {
                this.network.train(options, () => {
                    resolve();
                });
            });
        }
        async forward(options) {
            const ticksSum = this.ticksPerBeat * this.beatsLength;
            const output = {
                notes: []
            };
            for (let i = 0; i < ticksSum; i++) {
                const time = i / ticksSum;
                const beat = i / this.ticksPerBeat;
                const input = {
                    time,
                    ...options.params
                };
                const nnoutput = await this.network.predict(input);
                nnoutput.forEach((vel, i) => {
                    if (vel.value >= (options.confidence || 0.75))
                        output.notes.push({
                            index: i,
                            offset: beat,
                            velocity: 1
                        });
                });
            }
            return output;
        }
        async forwardToResource(res, options, convertOpt = {}) {
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
    MusicGenerator.Generator = Generator;
})(MusicGenerator || (MusicGenerator = {}));