import { Resources } from "../mixerycore/resources.js";
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
    async function convertToProjectFile(session) {
        let metaChunk = await Chunks.writeMetaData({
            type: MixeryFileType.PROJECT,
            name: session.projectName,
            description: session.projectDesc,
            timeCreated: session.projectCreationTime
        });
        let resourcesChunk = await session.resources.createFileChunk();
        return writeFile([
            metaChunk,
            resourcesChunk
        ]);
    }
    MixeryFileFormat.convertToProjectFile = convertToProjectFile;
    async function convertFromProjectFile(stream, session) {
        session.resetSession();
        let chunks = readFile(stream);
        chunks.forEach(chunk => {
            switch (chunk.id) {
                case "MetaData":
                    let metadata = Chunks.readMetaData(chunk);
                    session.projectName = metadata.name;
                    session.projectDesc = metadata.description;
                    session.projectCreationTime = metadata.timeCreated;
                    break;
                case "ResourceStore":
                    session.resources.readFileChunk(chunk, session);
                    break;
                default: break;
            }
        });
    }
    MixeryFileFormat.convertFromProjectFile = convertFromProjectFile;
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
            const name = stream.readString();
            const primaryAuthor = stream.readString();
            const displayName = stream.readString();
            const generatorConstructor = pluginsManager.mapped.get(primaryAuthor)?.generators.get(name);
            if (generatorConstructor)
                return undefined;
            generatorConstructor.constructPlugin(stream);
        }
        Generator.readGeneratorData = readGeneratorData;
        async function convertToGeneratorPresetFile(generator) {
            let metaChunk = await Chunks.writeMetaData({
                type: MixeryFileType.GENERATOR_PRESET,
                name: generator.displayName,
                description: "Description here...",
                timeCreated: Date.now()
            });
            let stream = new ByteStream.WriteableStream();
            writeGeneratorData(generator, stream);
            let pluginChunk = {
                id: "GeneratorData",
                data: await stream.convertToUint8Array()
            };
            return writeFile([
                metaChunk,
                pluginChunk
            ]);
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
        async function convertToAudioFile(buffer, name = "Unnamed Audio") {
            let metaChunk = await Chunks.writeMetaData({
                type: MixeryFileType.AUDIO_DATA,
                name,
                description: "Description here...",
                timeCreated: Date.now()
            });
            let stream = new ByteStream.WriteableStream();
            writeAudioData(buffer, stream);
            let audioChunk = {
                id: "AudioData",
                data: await stream.convertToUint8Array()
            };
            return writeFile([
                metaChunk,
                audioChunk
            ]);
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
        async function writeMetaData(meta) {
            let stream = new ByteStream.WriteableStream();
            stream.writeUint8(meta.type);
            stream.writeString(meta.name);
            stream.writeString(meta.description);
            stream.writeUint48(meta.timeCreated);
            return { id: "MetaData", data: await stream.convertToUint8Array() };
        }
        Chunks.writeMetaData = writeMetaData;
    })(Chunks = MixeryFileFormat.Chunks || (MixeryFileFormat.Chunks = {}));
    let MIDIs;
    (function (MIDIs) {
        function writeMIDIData(notes, stream) {
            stream.writeVarInt(notes.length);
            for (let i = 0; i < notes.length; i++) {
                const note = notes[i];
                stream.writeVarInt(note.note);
                stream.writeFloat32(note.start);
                stream.writeFloat32(note.duration);
                stream.writeFloat32(note.sensitivity);
            }
        }
        MIDIs.writeMIDIData = writeMIDIData;
        function readMIDIData(stream) {
            const notesCount = stream.readVarInt();
            let notes = [];
            for (let i = 0; i < notesCount; i++) {
                const note = stream.readVarInt();
                const start = stream.readFloat32();
                const duration = stream.readFloat32();
                const sensitivity = stream.readFloat32();
                notes.push({
                    note, start, duration, sensitivity
                });
            }
            return notes;
        }
        MIDIs.readMIDIData = readMIDIData;
    })(MIDIs = MixeryFileFormat.MIDIs || (MixeryFileFormat.MIDIs = {}));
    let Resource;
    (function (Resource) {
        function writeResourceData(res, stream) {
            stream.writeString(res.name);
            if (res instanceof Resources.MIDIResource) {
                stream.writeUint8(0);
                MIDIs.writeMIDIData(res.notes, stream);
            }
            else if (res instanceof Resources.AudioResource) {
                stream.writeUint8(1);
                Audio.writeAudioData(res.orignal || res.decoded, stream);
            }
        }
        Resource.writeResourceData = writeResourceData;
        function readResourceData(stream, session) {
            const name = stream.readString();
            const typeNo = stream.readUint8();
            if (typeNo === 0) {
                const notes = MIDIs.readMIDIData(stream);
                let res = new Resources.MIDIResource(name);
                res.notes = notes;
                return res;
            }
            else if (typeNo === 1) {
                const audioData = Audio.readAudioData(stream);
                if (audioData instanceof ArrayBuffer) {
                    if (session === undefined)
                        throw "Session info is required to decode audio";
                    return new Promise((resolve, reject) => {
                        session.decodeAudio(audioData, name).then(audioBuff => {
                            let res = new Resources.AudioResource(name, audioBuff);
                            resolve(res);
                        });
                    });
                }
                else if (audioData instanceof AudioBuffer) {
                    let res = new Resources.AudioResource(name, audioData);
                    return res;
                }
            }
        }
        Resource.readResourceData = readResourceData;
    })(Resource = MixeryFileFormat.Resource || (MixeryFileFormat.Resource = {}));
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