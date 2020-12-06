import { MixeryFileFormat } from "../fileformat/mixeryfile.js";
import AudioEncoder from "./encoder.js";
export default class MixeryAudioEncoder extends AudioEncoder {
    constructor() {
        super(...arguments);
        this.name = "Mixery Audio File Format";
        this.fileExt = "mxyaudio";
    }
    async encodeAudio(buffer) {
        let stream = await MixeryFileFormat.Audio.convertToAudioFile(buffer);
        return await stream.convertToArrayBuffer();
    }
}