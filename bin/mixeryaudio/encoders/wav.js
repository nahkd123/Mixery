import AudioEncoder from "./encoder.js";
export default class WavEncoder extends AudioEncoder {
    async encode(buffer) {
        const sampleRate = buffer.sampleRate;
        return null;
    }
}