var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    encodeAudio(buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.selectedEncoder === undefined)
                throw "No encoder selected";
            return yield this.selectedEncoder.encodeAudio(buffer);
        });
    }
}