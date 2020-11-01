import { Session } from "../mixerycore/session.js";
import { ByteStream } from "./filestream.js";

export namespace MixeryFileFormat {
    export const FILE_HEADER = new Uint8Array([0x4D, 0x69, 0x78, 0x65, 0x72, 0x79, 0x03, 0x04]);
    export function readFile(stream: ByteStream.ReadableStream) {
        stream.seekAfterHeader(FILE_HEADER);
        let chunks: MixeryFileChunk[] = [];
        let id: string;
        while ((id = stream.readString()).length !== 0) {
            let length = stream.readVarInt();
            let data = stream.readFixedBinaryData(length);
            chunks.push({id, data});
        }

        return chunks;
    }
    export function writeFile(chunks: MixeryFileChunk[]) {
        if (chunks.length === 0) throw "No chunk to write";
        let stream = new ByteStream.WriteableStream();
        stream.contents.push(FILE_HEADER);
        chunks.forEach(chunk => {
            stream.writeString(chunk.id);
            stream.writeVarInt(chunk.data.length);
            stream.writeBinaryData(chunk.data);
        });
        stream.writeString("");
        return stream;
    }

    export async function convertToProjectFile(session: Session) {
        let metaChunk = await Chunks.writeMetaData({
            type: MixeryFileType.PROJECT,
            name: session.projectName,
            description: session.projectDesc,
            timeCreated: session.projectCreationTime
        });

        return writeFile([
            metaChunk
        ]);
    }
    export async function convertToGeneratorPresetFile() {}
    
    export namespace Audio {
        /*
        Audio data:
        - Uint8 boolean                   hasOrignal
          + [0x00] (no orignal)
            - VarInt                      Sample Rate (samples/s or Hz)
            - VarInt                      Samples count
            - VarInt                      Number of channels (mostly 2 channels)
            - array of @[No. ch]          Channel data
              - Float32Array[Samples count]
          + [0x01] (has orignal)
            - VarInt                      dataLength
            - array of Uint8[dataLength]  data
        */

        export function writeAudioData(buffer: AudioBuffer | ArrayLike<number> | ArrayBuffer, stream: ByteStream.WriteableStream) {
            let hasOrignal = buffer instanceof AudioBuffer? 0 : 1;
            stream.writeUint8(hasOrignal);
            if (hasOrignal === 1) {
                let orignal = <ArrayLike<number>> (buffer instanceof ArrayBuffer? new Uint8Array(buffer) : buffer);
                stream.writeVarInt(orignal.length);
                stream.writeArray(orignal);
            } else {
                let audio = <AudioBuffer> buffer;
                stream.writeVarInt(audio.sampleRate);
                stream.writeVarInt(audio.length);
                stream.writeVarInt(audio.numberOfChannels);
                for (let i = 0; i < audio.numberOfChannels; i++) {
                    const channelData = audio.getChannelData(i);
                    stream.writeFloat32FixedArray(channelData);
                }
            }
        }
        export function readAudioData(stream: ByteStream.ReadableStream) {
            let hasOrignal = stream.readUint8();
            if (hasOrignal === 1) {
                let length = stream.readVarInt();
                return stream.readFixedBinaryData(length).buffer;
            } else {
                let sampleRate = stream.readVarInt();
                let samples = stream.readVarInt();
                let channelsCount = stream.readVarInt();

                let audioBuffer = new AudioBuffer({
                    length: samples,
                    sampleRate: sampleRate,
                    numberOfChannels: channelsCount
                });
                for (let i = 0; i < channelsCount; i++) {
                    let channelData = stream.readFloat32FixedArray(samples);
                    audioBuffer.copyToChannel(channelData, i, 0);
                }

                return audioBuffer;
            }
        }
        export async function convertToAudioFile(buffer: AudioBuffer | ArrayBuffer | ArrayLike<number>, name = "Unnamed Audio") {
            let metaChunk = await Chunks.writeMetaData({
                type: MixeryFileType.AUDIO_DATA,
                name,
                description: "Description here...",
                timeCreated: Date.now()
            });

            let stream = new ByteStream.WriteableStream();
            writeAudioData(buffer, stream);
            let audioChunk = <MixeryFileChunk> {
                id: "AudioData",
                data: await stream.convertToUint8Array()
            };

            return writeFile([
                metaChunk,
                audioChunk
            ]);
        }
        export function readAudioFile(data: ArrayBuffer | ArrayLike<number>) {
            let chunks = readFile(new ByteStream.ReadableStream(data));
            console.log(chunks);
            let audioDataChunk = chunks.find(value => value.id === "AudioData");
            return readAudioData(new ByteStream.ReadableStream(audioDataChunk.data));
        }
    }
    export namespace Chunks {
        export function readMetaData(input: MixeryFileChunk | MixeryFileChunk[]) {
            let chunk = input instanceof Array? input.find(value => (value.id === "MetaData")) : input;

            let stream = new ByteStream.ReadableStream(chunk.data);
            let type = stream.readUint8();
            let name = stream.readString();
            let description = stream.readString();
            let timeCreated = stream.readUint48();
            return <MixeryFileMeta> {type, name, description, timeCreated};
        }
        export async function writeMetaData(meta: MixeryFileMeta) {
            let stream = new ByteStream.WriteableStream();
            stream.writeUint8(meta.type);
            stream.writeString(meta.name);
            stream.writeString(meta.description);
            stream.writeUint48(meta.timeCreated);
            return <MixeryFileChunk> {id: "MetaData", data: await stream.convertToUint8Array()};
        }
    }
}

export interface MixeryFileChunk {
    id: string;
    data: Uint8Array;
}
export enum MixeryFileType {
    /** The dummy file type, mostly used in examples */
    DUMMY,

    /** The project file type, contains everything like clips, plugin presets and mixer configuration */
    PROJECT,

    /** Contains generator preset */
    GENERATOR_PRESET,

    /** Contains effect preset */
    EFFECT_PRESET,

    /** Contains mixer track configuration and it's plugins preset */
    MIXER_PRESET,

    /** The MIDI clip */
    MIDI_CLIP,

    /** The Audio clip/Audio file that only Mixery understand */
    AUDIO_DATA
}
export interface MixeryFileMeta {
    type: MixeryFileType;
    name: string;
    description: string;
    timeCreated: number;
}
export interface MixeryGeneratorPreset {
    /** The generator name */
    name: string;
    /** The generator author */
    author: string;
    /** Generator data */
    data: Uint8Array;
}