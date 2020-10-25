import { MIDINoteInfo } from "../mixerycore/midi";

namespace Chunks {
    export const HEADER = [0x4D, 0x54, 0x68, 0x64];
    export const TRACK = [0x4D, 0x54, 0x72, 0x6B];
}
function checkFile(contents: Uint8Array, pointer: number, compare: number[]) {
    for (let i = 0; i < compare.length; i++) if (contents[pointer + i] !== compare[i]) return false;
    return true;
}

export class ByteStream {
    data: Uint8Array;
    pointer: number = 0;

    constructor(data: Uint8Array) {
        this.data = data;
    }

    readBytesAsString(length: number) {
        const a = this.data;
        const ptr = this.pointer;
        this.pointer += length;
        return String.fromCharCode(...a.subarray(ptr, ptr + length));
    }
    readUint32() {
        const a = this.data;
        const ptr = this.pointer;
        this.pointer += 4;
        return (a[ptr] << 24) + (a[ptr + 1] << 16) + (a[ptr + 2] << 8) + a[ptr + 3];
    }
    readUint16() {
        const a = this.data;
        const ptr = this.pointer;
        this.pointer += 2;
        return (a[ptr] << 8) + a[ptr + 1];
    }
    readByte() {
        return this.data[this.pointer++];
    }
    readVarInt() {
        let val = 0;
        let pos = 0;
        let byte: number;
        while (((byte = this.readByte()) & 0x80) > 0) {
            val <<= 7;
            val += byte & 0x7F;
        }
        return (val << 7) + byte;
    }
    grabByteArray(length: number) {
        const ptr = this.pointer;
        this.pointer += length;
        return this.data.subarray(ptr, ptr + length);
    }

    get endOfStream() {return this.pointer >= this.data.length;};
}

/**
 * Includes contents inside a MIDI file.
 */
export default class MIDIFile extends ByteStream {
    trackChunks: MIDIFileChunk[] = [];
    headerChunk: MIDIFileChunk;

    header: MIDIFileHeader;
    tracks: MIDIFileTrack[] = [];

    constructor(contents: Uint8Array) {
        super(contents);
        this.readAllChunks();
        this.readHeader();
        this.readTracks();
        console.log(this);
    }

    readAllChunks() {
        while (!this.endOfStream) {
            const chunk = new MIDIFileChunk(this);
            if (chunk.type === "MThd") this.headerChunk = chunk;
            else this.trackChunks.push(chunk);
        }
    }

    readHeader() {
        const formatId = this.headerChunk.readUint16();
        this.header = {
            format: 
                formatId === 0? "singleTrack" :
                formatId === 1? "doubleTracks" :
                "multiTracks",
            tracksCount: this.headerChunk.readUint16(),
            tickDiv: this.headerChunk.readUint16()
        };
    }

    readTracks() {
        this.trackChunks.forEach(chunk => {
            let track: MIDIFileTrack = {
                name: "Unnamed Track",
                copyright: "",

                data: [],
                notes: [],
                metas: [],
                trackLength: 0
            };
            let streamReplay: number[][] = [];
            let streamReplayTime = 0;
            let program = 0;

            while (!chunk.endOfStream) {
                const deltaTime = chunk.readVarInt();
                const firstByte = chunk.readByte();
                const status = firstByte >> 4;

                streamReplayTime += deltaTime;

                if (firstByte >= 0x80 && firstByte <= 0xEF) {
                    // MIDI
                    const channel = firstByte & 0x0F;
                    let note, velocity: number;
                    let controller, value: number;
                    let program: number;
                    let pitch: number;

                    switch (status) {
                        case 0x8: // Note Off
                            note = chunk.readByte();
                            velocity = chunk.readByte();
                            if (velocity === 0 && streamReplay[note]) {
                                // Act like note off
                                track.notes.push({
                                    note,
                                    sensitivity: streamReplay[note][0] / 0x7F,
                                    start: streamReplay[note][1] / this.header.tickDiv,
                                    duration: (streamReplayTime - streamReplay[note][1]) / this.header.tickDiv
                                });
                                streamReplay[note] = undefined;
                            }
                            break;
                        case 0x9: // Note On (if vel == 0 then it will be note off)
                            note = chunk.readByte();
                            velocity = chunk.readByte();
                            if (velocity === 0 && streamReplay[note]) {
                                // Act like note off
                                track.notes.push({
                                    note,
                                    sensitivity: streamReplay[note][0] / 0x7F,
                                    start: streamReplay[note][1] / 128,
                                    duration: (streamReplayTime - streamReplay[note][1]) / 128
                                });
                                streamReplay[note] = undefined;
                            } else {
                                streamReplay[note] = [velocity, streamReplayTime];
                            }
                            break;
                        case 0xA:
                            note = chunk.readByte();
                            velocity = chunk.readByte();
                            break;
                        case 0xB:
                            controller = chunk.readByte();
                            value = chunk.readByte();
                            break;
                        case 0xC:
                            program = chunk.readByte();
                            break;
                        case 0xD:
                            velocity = chunk.readByte();
                            break;
                        case 0xE:
                            pitch = (chunk.readByte() << 7) + chunk.readByte();
                            break;
                        default: break;
                    }
                } else if (firstByte !== 0xFF) {
                    // SysEx event
                    let msgLength: number;
                    let msgData: Uint8Array;

                    switch (firstByte) {
                        case 0xF0:
                            msgLength = chunk.readByte();
                            msgData = chunk.grabByteArray(msgLength);
                            break;
                        case 0xF7:
                            msgLength = chunk.readByte();
                            msgData = chunk.grabByteArray(msgLength);
                            break;
                        default: break;
                    }
                } else {
                    // Meta event
                    const type = chunk.readByte();
                    const length = chunk.readVarInt();
                    const data = new ByteStream(chunk.grabByteArray(length));

                    switch (type) {
                        case 0x00: let seqNumber = data.readUint16(); break;
                        case 0x01: let text = data.readBytesAsString(length); break;
                        case 0x02: track.copyright = data.readBytesAsString(length); break;
                        case 0x03: track.name = data.readBytesAsString(length); break;
                        case 0x04: let instrumentName = data.readBytesAsString(length); break;

                        case 0x05: track.metas.push({
                            type: "lyric", time: streamReplayTime,
                            text: data.readBytesAsString(length)
                        }); break;

                        case 0x06: track.metas.push({
                            type: "marker", time: streamReplayTime,
                            text: data.readBytesAsString(length)
                        }); break;

                        case 0x07: track.metas.push({
                            type: "cuepoint", time: streamReplayTime,
                            text: data.readBytesAsString(length)
                        }); break;
                        
                        case 0x08: let programName = data.readBytesAsString(length); break;
                        case 0x09: let deviceName = data.readBytesAsString(length); break;
                        case 0x20: let channelPrefix = data.readByte(); break;
                        case 0x21: let midiPort = data.readByte(); break;
                        case 0x2F: break; // End of track

                        case 0x51: track.metas.push({
                            type: "tempo", time: streamReplayTime,
                            tempo: (data.data[0] << 16) + (data.data[1] << 8) + data.data[2]
                        }); break;
                        case 0x54: track.metas.push({
                            type: "smpteoffset", time: streamReplayTime,
                            hour: data.readByte(), mins: data.readByte(), secs: data.readByte()
                        }); break;

                        default: break;
                    }
                }
            }

            track.trackLength = streamReplayTime / 128 + 10;
            this.tracks.push(track);
        });
    }
}

export class MIDIFileChunk extends ByteStream {
    type: string;

    constructor(file: MIDIFile) {
        let type = file.readBytesAsString(4);
        const length = file.readUint32();
        super(file.grabByteArray(length));
        this.type = type;
    }
}

export interface MIDIFileHeader {
    format: "singleTrack" | "doubleTracks" | "multiTracks";
    tracksCount: number;
    tickDiv: number;
}

export interface MIDITrackData {
    deltaTime: number;
    type: "midi" | "sysex" | "meta";
}
export interface MIDITrackMetaData {
    type: "tempo" | "lyric" | "marker" | "cuepoint" | "smpteoffset";
    time: number;

    tempo?: number;
    text?: string;

    hour?: number; mins?: number; secs?: number;
}
export interface MIDIFileTrack {
    name: string;
    copyright: string;

    data: MIDITrackData[];
    notes: MIDINoteInfo[];
    metas: MIDITrackMetaData[];
    trackLength: number;
}