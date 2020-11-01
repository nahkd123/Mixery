import { MixeryFileFormat } from "../fileformat/mixeryfile.js";
import AudioEncoder from "./encoder.js";

export default class MixeryAudioEncoder extends AudioEncoder {
    name = "Mixery Audio File Format";
    fileExt = "mxyaudio";

    async encodeAudio(buffer: AudioBuffer) {
        let stream = await MixeryFileFormat.Audio.convertToAudioFile(buffer);
        return await stream.convertToArrayBuffer();
    }
}