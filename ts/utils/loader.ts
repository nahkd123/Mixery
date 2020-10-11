export default class Loader<T> {
    buffers: T[] = [];

    constructor(then = (buffers: T[]) => {}, ...promises: Promise<T>[]) {
        promises.forEach((promise, index) => {
            promise.then((buffer) => {
                this.buffers[index] = buffer;
                if (this.buffers.length === promises.length) then(this.buffers);
            });
        });
    }
}

export class ArrayBufferLoader extends Loader<ArrayBuffer> {}
export class AudioBufferLoader extends Loader<AudioBuffer> {}