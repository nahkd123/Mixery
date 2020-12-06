import { ByteStream } from "../fileformat/filestream.js";
import { RIFFFileFormat } from "../fileformat/riff.js";
import AudioEncoder from "./encoder.js";
export default class WaveFileAudioEncoder extends AudioEncoder {
    constructor() {
        super(...arguments);
        this.name = "Wave file";
        this.fileExt = "wav";
        this.bitsPerSample = 32;
    }
    async encodeToBlob(buffer) {
        const blockAlign = this.bitsPerSample / 8 * buffer.numberOfChannels;
        let formatInfo = {
            compression: RIFFFileFormat.WaveCompressionCode.UNCOMPRESSED,
            channelsCount: buffer.numberOfChannels,
            sampleRate: buffer.sampleRate,
            avgBytesPerSecond: buffer.sampleRate * blockAlign,
            blockAlign,
            bitsPerSample: this.bitsPerSample
        };
        let formatChunk = RIFFFileFormat.createWaveFormatChunk(formatInfo);
        let dataChunk = RIFFFileFormat.createWaveDataChunk(buffer, this.bitsPerSample);
        let stream = new ByteStream.WriteableStream();
        formatChunk.writeToStream(stream);
        dataChunk.writeToStream(stream);
        let uint8Array = await stream.convertToUint8Array();
        let riffHeader = RIFFFileFormat.createRIFFHeader("WAVE", uint8Array.length);
        let blob = new Blob([riffHeader, uint8Array]);
        return blob;
    }
    async encodeAudio(buffer) {
        let blob = await this.encodeToBlob(buffer);
        return await blob.arrayBuffer();
    }
}