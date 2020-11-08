var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MixeryFileFormat } from "../fileformat/mixeryfile.js";
import AudioEncoder from "./encoder.js";
export default class MixeryAudioEncoder extends AudioEncoder {
    constructor() {
        super(...arguments);
        this.name = "Mixery Audio File Format";
        this.fileExt = "mxyaudio";
    }
    encodeAudio(buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            let stream = yield MixeryFileFormat.Audio.convertToAudioFile(buffer);
            return yield stream.convertToArrayBuffer();
        });
    }
}