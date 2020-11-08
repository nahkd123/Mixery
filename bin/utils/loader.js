export default class Loader {
    constructor(then = (buffers) => { }, ...promises) {
        this.buffers = [];
        promises.forEach((promise, index) => {
            promise.then((buffer) => {
                this.buffers[index] = buffer;
                if (this.buffers.length === promises.length)
                    then(this.buffers);
            });
        });
    }
}
export class ArrayBufferLoader extends Loader {
}
export class AudioBufferLoader extends Loader {
}