export default class AudioEncoder {
}
export class AudioEncodersManager {
    constructor() {
        this.encoders = [];
        this.encoderMap = new Map();
        this.encoderFileExt = new Map();
    }
    addEncoder(encoder) {
        this.encoders.push(encoder);
        this.encoderMap.set(encoder.name, encoder);
        this.encoderFileExt.set(encoder.fileExt, encoder);
    }
    async encodeAudio(buffer) {
        if (this.selectedEncoder === undefined)
            throw "No encoder selected";
        return await this.selectedEncoder.encodeAudio(buffer);
    }
}