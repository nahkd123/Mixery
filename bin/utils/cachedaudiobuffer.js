export default class CachedAudioBuffer {
    constructor(buffer) {
        this.channels = [];
        this.buffer = buffer;
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            this.channels[i] = buffer.getChannelData(i);
        }
        this.numberOfChannels = buffer.numberOfChannels;
        this.sampleRate = buffer.sampleRate;
    }
    getChannelData(channel) {
        return this.channels[channel];
    }
}