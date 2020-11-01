export default abstract class AudioEncoder {
    abstract name: string;
    abstract fileExt: string;

    abstract async encodeAudio(buffer: AudioBuffer): Promise<ArrayBuffer>;
}

export class AudioEncodersManager {
    encoders: AudioEncoder[] = [];
    encoderMap: Map<string, AudioEncoder> = new Map();
    encoderFileExt: Map<string, AudioEncoder> = new Map();

    constructor() {}

    addEncoder(encoder: AudioEncoder) {
        this.encoders.push(encoder);
        this.encoderMap.set(encoder.name, encoder);
        this.encoderFileExt.set(encoder.fileExt, encoder);
    }
}