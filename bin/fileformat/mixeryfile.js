var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ByteStream } from "./filestream.js";
export var MixeryFileFormat;
(function (MixeryFileFormat) {
    MixeryFileFormat.FILE_HEADER = new Uint8Array([0x4D, 0x69, 0x78, 0x65, 0x72, 0x79, 0x03, 0x04]);
    function readFile(stream) {
        stream.seekAfterHeader(MixeryFileFormat.FILE_HEADER);
        let chunks = [];
        let id;
        while ((id = stream.readString()).length !== 0) {
            let length = stream.readVarInt();
            let data = stream.readFixedBinaryData(length);
            chunks.push({ id, data });
        }
        return chunks;
    }
    MixeryFileFormat.readFile = readFile;
    function writeFile(chunks) {
        if (chunks.length === 0)
            throw "No chunk to write";
        let stream = new ByteStream.WriteableStream();
        stream.contents.push(MixeryFileFormat.FILE_HEADER);
        chunks.forEach(chunk => {
            stream.writeString(chunk.id);
            stream.writeVarInt(chunk.data.length);
            stream.writeBinaryData(chunk.data);
        });
        stream.writeString("");
        return stream;
    }
    MixeryFileFormat.writeFile = writeFile;
    function convertToProjectFile(session) {
        return __awaiter(this, void 0, void 0, function* () {
            let metaChunk = yield Chunks.writeMetaData({
                type: MixeryFileType.PROJECT,
                name: session.projectName,
                description: session.projectDesc,
                timeCreated: session.projectCreationTime
            });
            return writeFile([
                metaChunk
            ]);
        });
    }
    MixeryFileFormat.convertToProjectFile = convertToProjectFile;
    let Generator;
    (function (Generator) {
        function writeGeneratorData(generator, stream) {
            stream.writeString(generator.name);
            stream.writeString(generator.author[0] || "unknown author");
            stream.writeString(generator.displayName);
            generator.writePluginData(stream);
        }
        Generator.writeGeneratorData = writeGeneratorData;
        function readGeneratorData(pluginsManager, stream) {
            var _a;
            const name = stream.readString();
            const primaryAuthor = stream.readString();
            const displayName = stream.readString();
            const generatorConstructor = (_a = pluginsManager.mapped.get(primaryAuthor)) === null || _a === void 0 ? void 0 : _a.generators.get(name);
            if (generatorConstructor)
                return undefined;
            generatorConstructor.constructPlugin(stream);
        }
        Generator.readGeneratorData = readGeneratorData;
        function convertToGeneratorPresetFile(generator) {
            return __awaiter(this, void 0, void 0, function* () {
                let metaChunk = yield Chunks.writeMetaData({
                    type: MixeryFileType.GENERATOR_PRESET,
                    name: generator.displayName,
                    description: "Description here...",
                    timeCreated: Date.now()
                });
                let stream = new ByteStream.WriteableStream();
                writeGeneratorData(generator, stream);
                let pluginChunk = {
                    id: "GeneratorData",
                    data: yield stream.convertToUint8Array()
                };
                return writeFile([
                    metaChunk,
                    pluginChunk
                ]);
            });
        }
        Generator.convertToGeneratorPresetFile = convertToGeneratorPresetFile;
        function readGeneratorPresetFile(pluginsManager, data) {
            let chunks = readFile(new ByteStream.ReadableStream(data));
            let pluginDataChunk = chunks.find(value => value.id === "GeneratorData");
            return readGeneratorData(pluginsManager, new ByteStream.ReadableStream(pluginDataChunk.data));
        }
        Generator.readGeneratorPresetFile = readGeneratorPresetFile;
    })(Generator = MixeryFileFormat.Generator || (MixeryFileFormat.Generator = {}));
    let Audio;
    (function (Audio) {
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
        function writeAudioData(buffer, stream) {
            let hasOrignal = buffer instanceof AudioBuffer ? 0 : 1;
            stream.writeUint8(hasOrignal);
            if (hasOrignal === 1) {
                let orignal = (buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer);
                stream.writeVarInt(orignal.length);
                stream.writeArray(orignal);
            }
            else {
                let audio = buffer;
                stream.writeVarInt(audio.sampleRate);
                stream.writeVarInt(audio.length);
                stream.writeVarInt(audio.numberOfChannels);
                for (let i = 0; i < audio.numberOfChannels; i++) {
                    const channelData = audio.getChannelData(i);
                    stream.writeFloat32FixedArray(channelData);
                }
            }
        }
        Audio.writeAudioData = writeAudioData;
        function readAudioData(stream) {
            let hasOrignal = stream.readUint8();
            if (hasOrignal === 1) {
                let length = stream.readVarInt();
                return stream.readFixedBinaryData(length).buffer;
            }
            else {
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
        Audio.readAudioData = readAudioData;
        function convertToAudioFile(buffer, name = "Unnamed Audio") {
            return __awaiter(this, void 0, void 0, function* () {
                let metaChunk = yield Chunks.writeMetaData({
                    type: MixeryFileType.AUDIO_DATA,
                    name,
                    description: "Description here...",
                    timeCreated: Date.now()
                });
                let stream = new ByteStream.WriteableStream();
                writeAudioData(buffer, stream);
                let audioChunk = {
                    id: "AudioData",
                    data: yield stream.convertToUint8Array()
                };
                return writeFile([
                    metaChunk,
                    audioChunk
                ]);
            });
        }
        Audio.convertToAudioFile = convertToAudioFile;
        function readAudioFile(data) {
            let chunks = readFile(new ByteStream.ReadableStream(data));
            let audioDataChunk = chunks.find(value => value.id === "AudioData");
            return readAudioData(new ByteStream.ReadableStream(audioDataChunk.data));
        }
        Audio.readAudioFile = readAudioFile;
    })(Audio = MixeryFileFormat.Audio || (MixeryFileFormat.Audio = {}));
    let Chunks;
    (function (Chunks) {
        function readMetaData(input) {
            let chunk = input instanceof Array ? input.find(value => (value.id === "MetaData")) : input;
            let stream = new ByteStream.ReadableStream(chunk.data);
            let type = stream.readUint8();
            let name = stream.readString();
            let description = stream.readString();
            let timeCreated = stream.readUint48();
            return { type, name, description, timeCreated };
        }
        Chunks.readMetaData = readMetaData;
        function writeMetaData(meta) {
            return __awaiter(this, void 0, void 0, function* () {
                let stream = new ByteStream.WriteableStream();
                stream.writeUint8(meta.type);
                stream.writeString(meta.name);
                stream.writeString(meta.description);
                stream.writeUint48(meta.timeCreated);
                return { id: "MetaData", data: yield stream.convertToUint8Array() };
            });
        }
        Chunks.writeMetaData = writeMetaData;
    })(Chunks = MixeryFileFormat.Chunks || (MixeryFileFormat.Chunks = {}));
})(MixeryFileFormat || (MixeryFileFormat = {}));
export var MixeryFileType;
(function (MixeryFileType) {
    /** The dummy file type, mostly used in examples */
    MixeryFileType[MixeryFileType["DUMMY"] = 0] = "DUMMY";
    /** The project file type, contains everything like clips, plugin presets and mixer configuration */
    MixeryFileType[MixeryFileType["PROJECT"] = 1] = "PROJECT";
    /** Contains generator preset */
    MixeryFileType[MixeryFileType["GENERATOR_PRESET"] = 2] = "GENERATOR_PRESET";
    /** Contains effect preset */
    MixeryFileType[MixeryFileType["EFFECT_PRESET"] = 3] = "EFFECT_PRESET";
    /** Contains mixer track configuration and it's plugins preset */
    MixeryFileType[MixeryFileType["MIXER_PRESET"] = 4] = "MIXER_PRESET";
    /** The MIDI clip */
    MixeryFileType[MixeryFileType["MIDI_CLIP"] = 5] = "MIDI_CLIP";
    /** The Audio clip/Audio file that only Mixery understand */
    MixeryFileType[MixeryFileType["AUDIO_DATA"] = 6] = "AUDIO_DATA";
})(MixeryFileType || (MixeryFileType = {}));