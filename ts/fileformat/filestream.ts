export namespace ByteStreamData {
    export namespace convertFrom {
        export function uint16(val: number) {
            return new Uint8Array([val & 0xFF00, val & 0x00FF]);
        }
        export function uint24(val: number) {
            return new Uint8Array([val & 0xFF0000, val & 0x00FF00, val & 0x0000FF]);
        }
        export function uint32(val: number) {
            return new Uint8Array([
                val & 0xFF000000,
                val & 0x00FF0000,
                val & 0x0000FF00,
                val & 0x000000FF
            ]);
        }
        export function uint48(val: number) {
            return new Uint8Array([
                val & 0xFF00000000,
                val & 0x00FF000000,
                val & 0x0000FF0000,
                val & 0x000000FF00,
                val & 0x00000000FF
            ]);
        }
        export function float32(val: number) {
            let buffer = new ArrayBuffer(4);
            let floatArr = new Float32Array(buffer);
            floatArr[0] = val;
            return new Uint8Array(floatArr);
        }
        export function float64(val: number) {
            let buffer = new ArrayBuffer(8);
            let floatArr = new Float64Array(buffer);
            floatArr[0] = val;
            return new Uint8Array(floatArr);
        }
    }

    export namespace convertTo {
        export function fixedUint(data: ArrayLike<number>) {
            let val = 0;
            for (let i = 0; i < data.length; i++) {
                val <<= 8;
                val += data[i];
            }
            return val;
        }
        export function float32(data: ArrayLike<number>) {
            if (data.length !== 4) throw "Not 32-bit value";
            let arr = data instanceof Uint8Array? data : new Uint8Array(data);
            let buffer = arr.buffer;
            let floatArr = new Float32Array(buffer);
            return floatArr[0];
        }
        export function float64(data: ArrayLike<number>) {
            if (data.length !== 8) throw "Not 64-bit value";
            let arr = data instanceof Uint8Array? data : new Uint8Array(data);
            let buffer = arr.buffer;
            let floatArr = new Float64Array(buffer);
            return floatArr[0];
        }
    }
}

export namespace ByteStream {
    export class ReadableStream {
        pointer: number = 0;
        data: Uint8Array;
        get eof() {return this.pointer >= this.data.length;}

        constructor(data: ArrayLike<number> | ArrayBuffer) {
            if (data instanceof Uint8Array) this.data = data;
            else this.data = new Uint8Array(data);
        }

        readFixedBinaryData(length: number) {
            let data = this.data.slice(this.pointer, length + this.pointer);
            this.pointer += length;
            return data;
        }
        readUint8() { return this.data[this.pointer++]; }
        readFixedUint(length: number) {
            let val = 0;
            for (let i = 0; i < length; i++) {
                val <<= 8;
                val += this.data[this.pointer + i];
            }
            this.pointer += length;
            return val;
        }
        readUint16() { return this.readFixedUint(2); }
        readUint24() { return this.readFixedUint(3); }
        readUint32() { return this.readFixedUint(4); }
        readUint48() { return this.readFixedUint(5); }
        readVarInt() {
            let val = 0, shift = 0, byte;
            while (((byte = this.readUint8()) & 0b10000000) !== 0) {
                val += (byte & 0b01111111) << shift;
                shift += 7;
            }
            val += byte << shift;
            return val;
        }
        readUnicodeString() {
            let length = this.readVarInt();
            let str = "";
            for (let i = 0; i < length; i++) str += String.fromCharCode(this.readVarInt());
            return str;
        }
        readString() { return this.readUnicodeString(); }
        readFloat32() { return ByteStreamData.convertTo.float32(this.readFixedBinaryData(4)); }
        readFloat64() { return ByteStreamData.convertTo.float64(this.readFixedBinaryData(8)); }
        readFloat32FixedArray(length: number) {
            let buffer = this.readFixedBinaryData(length * 4).buffer;
            return new Float32Array(buffer);
        }

        /**
         * Seek after header
         * @param headerData The header data
         * @returns true if the header found, otherwise false
         */
        seekAfterHeader(headerData: ArrayLike<number>) {
            const self = this;
            function compareHeader() {
                for (let i = 0; i < headerData.length; i++) if (self.data[self.pointer + i] !== headerData[i]) return false;
                return true;
            }
            while (!compareHeader()) {
                this.pointer++;
                if (this.eof) return false;
            }
            this.pointer += headerData.length;
            return true;
        }
    }
    export class WriteableStream {
        contents: BlobPart[] = [];
        position: number = 0;

        writeArray(val: ArrayLike<number>) {
            if (val instanceof Uint8Array) this.contents.push(val);
            else this.contents.push(new Uint8Array(val));
            this.position += val.length;
        }
        writeUint8(val: number) { this.writeArray([val]); this.position++; }
        writeUint16(val: number) {
            this.contents.push(new Uint8Array([
                (val & 0xFF00) >> 8,
                (val & 0x00FF)
            ]));
            this.position += 2;
        }
        writeUint24(val: number) {
            this.contents.push(new Uint8Array([
                (val & 0xFF0000) >> 16,
                (val & 0x00FF00) >> 8,
                (val & 0x0000FF)
            ]));
            this.position += 3;
        }
        writeUint32(val: number) {
            this.contents.push(new Uint8Array([
                (val & 0xFF000000) >> 24,
                (val & 0x00FF0000) >> 16,
                (val & 0x0000FF00) >> 8,
                (val & 0x000000FF)
            ]));
            this.position += 4;
        }
        writeUint48(val: number) {
            this.contents.push(new Uint8Array([
                (val & 0xFF00000000) >> 32,
                (val & 0x00FF000000) >> 24,
                (val & 0x0000FF0000) >> 16,
                (val & 0x000000FF00) >> 8,
                (val & 0x00000000FF)
            ]));
            this.position += 5;
        }
        // yes i know that's programming practice

        writeVarInt(val: number) {
            let array: number[] = [];
            let log: number;
            while (val !== 0) {
                log = val & 0b01111111;
                val >>= 7;
                array.push(log | (val === 0? 0 : 0b10000000));
            }
            this.writeArray(array);
        }
        writeUnicodeString(str: string) {
            this.writeVarInt(str.length);
            for (let i = 0; i < str.length; i++) this.writeVarInt(str.charCodeAt(i));
        }
        writeString(str: string) { this.writeUnicodeString(str); }
        writeBinaryData(data: ArrayLike<number>) {
            if (data instanceof ArrayBuffer || data instanceof Uint8Array) this.contents.push(data);
            else this.contents.push(new Uint8Array(data));
        }
        writeFloat32(val: number) { this.contents.push(ByteStreamData.convertFrom.float32(val)); this.position += 4; }
        writeFloat64(val: number) { this.contents.push(ByteStreamData.convertFrom.float64(val)); this.position += 8; }
        writeFloat32FixedArray(arr: Float32Array) {
            let buffer = arr.buffer;
            this.contents.push(new Uint8Array(buffer));
            this.position += arr.length * 4;
        }

        convertToBlob(options?: BlobPropertyBag) {
            return new Blob(this.contents, options);
        }
        async convertToArrayBuffer() {
            return await (this.convertToBlob()).arrayBuffer();
        }
        async convertToReadableStream() {
            return new ReadableStream(await this.convertToArrayBuffer());
        }
        async convertToUint8Array() {
            return new Uint8Array(await this.convertToArrayBuffer());
        }
    }
}

function byteAsBinary(val: number) {
    let str = val.toString(2);
    return str.padStart(16, "-");
}