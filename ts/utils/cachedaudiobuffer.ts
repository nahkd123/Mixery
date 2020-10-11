export default class CachedAudioBuffer {
    channels: Float32Array[] = [];
    buffer: AudioBuffer;

    constructor(buffer: AudioBuffer) {
        this.buffer = buffer;
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            this.channels[i] = buffer.getChannelData(i);
        }

        this.numberOfChannels = buffer.numberOfChannels;
        this.sampleRate = buffer.sampleRate;
    }

    getChannelData(channel: number) {
        return this.channels[channel];
    }

    readonly numberOfChannels: number;
    readonly sampleRate: number;
}