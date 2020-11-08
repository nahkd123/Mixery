import { notesIndex } from "../mixerycore/notes.js";
function parseStringExpression(input, index) {
    let output = "";
    input.forEach(val => {
        if (typeof val === "string")
            output += val;
        else {
            if (val.type === "number") {
                switch (val.direction) {
                    case "increase":
                        output += (val.start + index + "").padStart(val.digits | 0, "0");
                        break;
                    case "decrease":
                        output += (val.start - index + "").padStart(val.digits | 0, "0");
                        break;
                    default: break;
                }
            }
        }
    });
    return output;
}
export default class AudioMap {
    /**
     * Create an AudioMap
     * @param audioDecoder The audio context to decode audio
     */
    constructor(audioDecoder, mapInfo, loader, onloaded) {
        this.mappedBuffers = [];
        this.buffersLoaded = 0;
        this.buffersNeeded = 0;
        this.loadLock = false;
        this.decoder = audioDecoder;
        this.mapInfo = mapInfo;
        this.loader = loader;
        this.onloaded = onloaded;
        this.startLoad();
    }
    startLoad() {
        this.loadLock = true;
        this.buffersLoaded = 0;
        this.buffersNeeded = 0;
        this.mapInfo.mapping.forEach(mapEntry => {
            const from = notesIndex.get(mapEntry.from);
            const to = notesIndex.get(mapEntry.to);
            this.buffersNeeded += to - from + 1;
            for (let i = from; i <= to; i++) {
                const index = i - from;
                if (this.loader !== undefined)
                    this.loader(parseStringExpression(mapEntry.files, index)).then(buffer => {
                        this.decoder.decodeAudioData(buffer, (audio) => {
                            this.mappedBuffers[i] = audio;
                            this.buffersLoaded++;
                            if (!this.loadLock && this.buffersLoaded >= this.buffersNeeded)
                                this.onloaded(this);
                        }, (error) => { });
                    });
            }
        });
        this.loadLock = false;
        if (this.buffersLoaded >= this.buffersNeeded)
            this.onloaded(this);
    }
}