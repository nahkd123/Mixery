var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    encodeToBlob(buffer) {
        return __awaiter(this, void 0, void 0, function* () {
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
            let uint8Array = yield stream.convertToUint8Array();
            let riffHeader = RIFFFileFormat.createRIFFHeader("WAVE", uint8Array.length);
            let blob = new Blob([riffHeader, uint8Array]);
            return blob;
        });
    }
    encodeAudio(buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            let blob = yield this.encodeToBlob(buffer);
            return yield blob.arrayBuffer();
        });
    }
}