export var ByteStreamData;
(function (ByteStreamData) {
    let convertFrom;
    (function (convertFrom) {
        function uint16(val) {
            return new Uint8Array([val & 0xFF00, val & 0x00FF]);
        }
        convertFrom.uint16 = uint16;
        function uint24(val) {
            return new Uint8Array([val & 0xFF0000, val & 0x00FF00, val & 0x0000FF]);
        }
        convertFrom.uint24 = uint24;
        function uint32(val) {
            return new Uint8Array([
                val & 0xFF000000,
                val & 0x00FF0000,
                val & 0x0000FF00,
                val & 0x000000FF
            ]);
        }
        convertFrom.uint32 = uint32;
        function uint48(val) {
            return new Uint8Array([
                val & 0xFF00000000,
                val & 0x00FF000000,
                val & 0x0000FF0000,
                val & 0x000000FF00,
                val & 0x00000000FF
            ]);
        }
        convertFrom.uint48 = uint48;
        function float32(val) {
            let buffer = new ArrayBuffer(4);
            let floatArr = new Float32Array(buffer);
            floatArr[0] = val;
            return new Uint8Array(floatArr);
        }
        convertFrom.float32 = float32;
        function float64(val) {
            let buffer = new ArrayBuffer(8);
            let floatArr = new Float64Array(buffer);
            floatArr[0] = val;
            return new Uint8Array(floatArr);
        }
        convertFrom.float64 = float64;
    })(convertFrom = ByteStreamData.convertFrom || (ByteStreamData.convertFrom = {}));
    let convertTo;
    (function (convertTo) {
        function fixedUint(data) {
            let val = 0;
            for (let i = 0; i < data.length; i++) {
                val <<= 8;
                val += data[i];
            }
            return val;
        }
        convertTo.fixedUint = fixedUint;
        function float32(data) {
            if (data.length !== 4)
                throw "Not 32-bit value";
            let arr = data instanceof Uint8Array ? data : new Uint8Array(data);
            let buffer = arr.buffer;
            let floatArr = new Float32Array(buffer);
            return floatArr[0];
        }
        convertTo.float32 = float32;
        function float64(data) {
            if (data.length !== 8)
                throw "Not 64-bit value";
            let arr = data instanceof Uint8Array ? data : new Uint8Array(data);
            let buffer = arr.buffer;
            let floatArr = new Float64Array(buffer);
            return floatArr[0];
        }
        convertTo.float64 = float64;
    })(convertTo = ByteStreamData.convertTo || (ByteStreamData.convertTo = {}));
})(ByteStreamData || (ByteStreamData = {}));
export var ByteStream;
(function (ByteStream) {
    class ReadableStream {
        constructor(data) {
            this.pointer = 0;
            if (data instanceof Uint8Array)
                this.data = data;
            else
                this.data = new Uint8Array(data);
        }
        get eof() { return this.pointer >= this.data.length; }
        readFixedBinaryData(length) {
            let data = this.data.slice(this.pointer, length + this.pointer);
            this.pointer += length;
            return data;
        }
        readUint8() { return this.data[this.pointer++]; }
        readFixedUint(length) {
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
            for (let i = 0; i < length; i++)
                str += String.fromCharCode(this.readVarInt());
            return str;
        }
        readString() { return this.readUnicodeString(); }
        readFloat32() { return ByteStreamData.convertTo.float32(this.readFixedBinaryData(4)); }
        readFloat64() { return ByteStreamData.convertTo.float64(this.readFixedBinaryData(8)); }
        readFloat32FixedArray(length) {
            let buffer = this.readFixedBinaryData(length * 4).buffer;
            return new Float32Array(buffer);
        }
        /**
         * Seek after header
         * @param headerData The header data
         * @returns true if the header found, otherwise false
         */
        seekAfterHeader(headerData) {
            const self = this;
            function compareHeader() {
                for (let i = 0; i < headerData.length; i++)
                    if (self.data[self.pointer + i] !== headerData[i])
                        return false;
                return true;
            }
            while (!compareHeader()) {
                this.pointer++;
                if (this.eof)
                    return false;
            }
            this.pointer += headerData.length;
            return true;
        }
    }
    ByteStream.ReadableStream = ReadableStream;
    class WriteableStream {
        constructor() {
            this.contents = [];
            this.position = 0;
        }
        writeArray(val) {
            if (val instanceof Uint8Array)
                this.contents.push(val);
            else
                this.contents.push(new Uint8Array(val));
            this.position += val.length;
        }
        writeUint8(val) { this.writeArray([val]); this.position++; }
        writeUint16(val) {
            this.contents.push(new Uint8Array([
                (val & 0xFF00) >> 8,
                (val & 0x00FF)
            ]));
            this.position += 2;
        }
        writeUint24(val) {
            this.contents.push(new Uint8Array([
                (val & 0xFF0000) >> 16,
                (val & 0x00FF00) >> 8,
                (val & 0x0000FF)
            ]));
            this.position += 3;
        }
        writeUint32(val) {
            this.contents.push(new Uint8Array([
                (val & 0xFF000000) >> 24,
                (val & 0x00FF0000) >> 16,
                (val & 0x0000FF00) >> 8,
                (val & 0x000000FF)
            ]));
            this.position += 4;
        }
        writeUint48(val) {
            this.contents.push(new Uint8Array([
                (val & 0xFF00000000) >> 32,
                (val & 0x00FF000000) >> 24,
                (val & 0x0000FF0000) >> 16,
                (val & 0x000000FF00) >> 8,
                (val & 0x00000000FF)
            ]));
            this.position += 5;
        }
        writeVarInt(val) {
            let array = [];
            let log;
            while (val !== 0) {
                log = val & 0b01111111;
                val >>= 7;
                array.push(log | (val === 0 ? 0 : 0b10000000));
            }
            this.writeArray(array);
        }
        writeUnicodeString(str) {
            this.writeVarInt(str.length);
            for (let i = 0; i < str.length; i++)
                this.writeVarInt(str.charCodeAt(i));
        }
        writeString(str) { this.writeUnicodeString(str); }
        writeBinaryData(data) {
            if (data instanceof ArrayBuffer || data instanceof Uint8Array)
                this.contents.push(data);
            else
                this.contents.push(new Uint8Array(data));
        }
        writeFloat32(val) { this.contents.push(ByteStreamData.convertFrom.float32(val)); this.position += 4; }
        writeFloat64(val) { this.contents.push(ByteStreamData.convertFrom.float64(val)); this.position += 8; }
        writeFloat32FixedArray(arr) {
            let buffer = arr.buffer;
            this.contents.push(new Uint8Array(buffer));
            this.position += arr.length * 4;
        }
        convertToBlob(options) {
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
    ByteStream.WriteableStream = WriteableStream;
})(ByteStream || (ByteStream = {}));
function byteAsBinary(val) {
    let str = val.toString(2);
    return str.padStart(16, "-");
}