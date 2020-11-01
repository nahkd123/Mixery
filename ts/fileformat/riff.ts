import { ByteStream } from "./filestream";

export namespace RIFFFileFormat {
    export class Chunk {
        id: string;
        data: Uint8Array;
        writeToStream(stream: ByteStream.WriteableStream) {
            let chunkHeader = new Uint8Array(8);
            DataTypes.string(this.id, chunkHeader, 0);
            DataTypes.uint32(this.data.length, chunkHeader, 4);
            stream.contents.push(chunkHeader, this.data);
        }
    }
    export class ParentChunk extends Chunk {
        children: Chunk[] = [];
    }

    export function createRIFFHeader(riffType: string, size: number) {
        if (riffType.length !== 4) throw "riffType must be 4 characters long.";
        let header = new Uint8Array(12);
        DataTypes.string("RIFF", header, 0);
        DataTypes.uint32(size, header, 4);
        DataTypes.string(riffType, header, 8);
        return header;
    }
    export function createWaveFormatChunk(info: WaveFormatChunkInfo) {
        let chunk = new Chunk();
        chunk.id = "fmt ";

        let basicInfoData = new Uint8Array(16);
        DataTypes.uint16(info.compression      , basicInfoData, 0);  // --
        DataTypes.uint16(info.channelsCount    , basicInfoData, 2);  // --
        DataTypes.uint32(info.sampleRate       , basicInfoData, 4);  // ----
        DataTypes.uint32(info.avgBytesPerSecond, basicInfoData, 8);  // ----
        DataTypes.uint16(info.blockAlign       , basicInfoData, 12); // --
        DataTypes.uint16(info.bitsPerSample    , basicInfoData, 14); // --
        if (info.extraFormatBytes) {}
        else chunk.data = basicInfoData;
        return chunk;
    }
    export function createWaveDataChunk(buffer: AudioBuffer, bitsPerSample: number = 32) {
        if (bitsPerSample !== 32) throw "Only support 32 bits at this moment.";

        let chunk = new Chunk();
        chunk.id = "data";

        const bytesPerSample = bitsPerSample / 8;
        const unsignedMaxValue = Math.pow(2, bitsPerSample);
        const maxValue = Math.floor(unsignedMaxValue / 2) - 1;
        const minValue = -Math.floor(maxValue) - 1;
        let dataArray = new Uint8Array(buffer.numberOfChannels * bytesPerSample * buffer.length);
        let channels: Float32Array[] = [];
        for (let i = 0; i < buffer.numberOfChannels; i++) channels[i] = buffer.getChannelData(i);
        console.log(channels[0][0], channels[1][0]);

        let val: number;
        for (let i = 0; i < buffer.length; i++) {
            const pos = i * buffer.numberOfChannels * bytesPerSample;
            for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                val = Math.min(Math.max(Math.round(channels[channel][i] * maxValue), minValue), maxValue);
                DataTypes.sint32(val, dataArray, pos + channel * bytesPerSample);
            }
        }

        chunk.data = dataArray;
        return chunk;
    }
    export interface WaveFormatChunkInfo {
        compression: WaveCompressionCode;
        channelsCount: number;
        sampleRate: number;
        avgBytesPerSecond: number;
        blockAlign: number;
        bitsPerSample: number;
        extraFormatBytes?: Uint8Array;
    }
    export enum WaveCompressionCode {
        UNKNOWN,
        UNCOMPRESSED
    }
    
    /**
     * Data types for RIFF file format. Everything is in little-endian
     */
    export namespace DataTypes {
        export function uint32(val: number, arr = new Uint8Array(4), offset = 0) {
            arr[offset + 0] = val & 0x000000FF;
            arr[offset + 1] = (val & 0x0000FF00) >> 8;
            arr[offset + 2] = (val & 0x00FF0000) >> 16;
            arr[offset + 3] = (val & 0xFF000000) >> 24;
            return arr;
        }
        export function sint32(val: number, arr = new Uint8Array(4), offset = 0) {
            let arrSigned = new Int32Array(1);
            arrSigned[0] = val;
            let arrSignedUint = new Uint8Array(arrSigned.buffer);
            arr[offset + 0] = arrSignedUint[0];
            arr[offset + 1] = arrSignedUint[1];
            arr[offset + 2] = arrSignedUint[2];
            arr[offset + 3] = arrSignedUint[3];
            return arr;
        }
        export function uint16(val: number, arr = new Uint8Array(2), offset = 0) {
            arr[offset + 0] = val & 0x00FF;
            arr[offset + 1] = (val & 0xFF00) >> 8;
            return arr;
        }
        export function string(str: string, arr = new Uint8Array(str.length), offset = 0) {
            for (let i = 0; i < str.length; i++) arr[offset + i] = str.charCodeAt(i);
            return arr;
        }
    }
}