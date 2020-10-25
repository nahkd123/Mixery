import { notesIndex, notesName } from "../mixerycore/notes.js";

export type StringType = "number";
export type StringExpressionDirection = "increase" | "decrease";

export interface StringExpression {
    type: StringType;
    direction: StringExpressionDirection;
    start?: number;
    digits?: number;
}
function parseStringExpression(input: (string | StringExpression)[], index: number) {
    let output = "";
    input.forEach(val => {
        if (typeof val === "string") output += val;
        else {
            if (val.type === "number") {
                switch (val.direction) {
                    case "increase": output += (val.start + index + "").padStart(val.digits | 0, "0"); break;
                    case "decrease": output += (val.start - index + "").padStart(val.digits | 0, "0"); break;
                    default: break;
                }
            }
        }
    });
    return output;
}
export interface AudioMappingEntry {
    /** The start note (Ex: C0) */
    from: string;

    /** The end note (Ex: C10) */
    to: string;

    files: (string | StringExpression)[];
}
export interface AudioMapInfo {
    mapping: AudioMappingEntry[];
}

export default class AudioMap {
    decoder: BaseAudioContext;
    mappedBuffers: AudioBuffer[] = [];

    buffersLoaded: number = 0;
    buffersNeeded: number = 0;
    loadLock: boolean = false;

    mapInfo: AudioMapInfo;
    loader: (name: string) => Promise<ArrayBuffer>;
    onloaded: (map: AudioMap) => void;

    /**
     * Create an AudioMap
     * @param audioDecoder The audio context to decode audio
     */
    constructor(audioDecoder: BaseAudioContext, mapInfo: AudioMapInfo, loader?: (name: string) => Promise<ArrayBuffer>, onloaded?: (map: AudioMap) => void) {
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
            const to   = notesIndex.get(mapEntry.to);
            this.buffersNeeded += to - from + 1;

            for (let i = from; i <= to; i++) {
                const index = i - from;
                if (this.loader !== undefined) this.loader(parseStringExpression(mapEntry.files, index)).then(buffer => {
                    this.decoder.decodeAudioData(buffer, (audio) => {
                        this.mappedBuffers[i] = audio;
                        this.buffersLoaded++;
                        if (!this.loadLock && this.buffersLoaded >= this.buffersNeeded) this.onloaded(this);
                    }, (error) => {});
                });
            }
        });

        this.loadLock = false;
        if (this.buffersLoaded >= this.buffersNeeded) this.onloaded(this);
    }
}