import { ByteStream } from "../fileformat/filestream.js";
import { MixeryFileFormat } from "../fileformat/mixeryfile.js";
export var Resources;
(function (Resources) {
    class Resource {
        constructor(name) {
            this._name = name;
        }
        get name() { return this._name; }
        set name(val) {
            this._name = val;
            if (this.linkedElement)
                this.linkedElement.element.querySelector("div.resname").textContent = val;
        }
    }
    Resources.Resource = Resource;
    class CompoundResource extends Resource {
        constructor() {
            super(...arguments);
            this.children = [];
        }
    }
    Resources.CompoundResource = CompoundResource;
    class AudioResource extends Resource {
        constructor(name, decoded) {
            super(name);
            this.decoded = decoded;
        }
    }
    Resources.AudioResource = AudioResource;
    class MIDIResource extends Resource {
        constructor() {
            super(...arguments);
            this.notes = [];
        }
        get actualLength() {
            if (this.notes.length === 0)
                return 0;
            this.notes.sort((a, b) => a.start - b.start);
            let targetNote = this.notes[this.notes.length - 1];
            return targetNote.start + targetNote.duration;
        }
        get noteRange() {
            let min = -1;
            let max = -1;
            this.notes.forEach(note => {
                if (min === -1 || note.note < min)
                    min = note.note;
                if (max === -1 || note.note > max)
                    max = note.note;
            });
            return [min, max];
        }
    }
    Resources.MIDIResource = MIDIResource;
})(Resources || (Resources = {}));
function search(resources, kwd) {
    for (let i = 0; i < resources.length; i++)
        if (resources[i]._name === kwd)
            return resources[i];
    return undefined;
}
export default class ResourcesStore {
    constructor() {
        this.currentDirScope = [];
        this.selectedResource = undefined;
        this.resources = [];
    }
    get currentDir() {
        let current = this.resources;
        this.currentDirScope.forEach(name => {
            let next = search(current, name);
            if (next === undefined)
                throw "Unknown path";
            else if (next instanceof Resources.CompoundResource)
                current = next.children;
            else
                throw name + " is not a resource compound/directory";
        });
        return current;
    }
    dirScopeToPath() {
        return "/" + this.currentDirScope.join("/");
    }
    pathToDirScope(path) {
        if (!path.startsWith("/"))
            throw "The path must contains root level directory (Ex: /a/b/c instead of a/b/c)";
        path = path.substr(1, path.length - 1 - (path.endsWith("/") ? 1 : 0));
        this.currentDirScope = path.split("/");
    }
    newMIDIResource() {
        let currentDir = this.currentDir;
        let res = new Resources.MIDIResource("MIDI Clip #" + (currentDir.length + 1));
        this.selectedResource = res;
        return this.addResource(res);
    }
    newAudioResource(decoded, orignal) {
        let currentDir = this.currentDir;
        let res = new Resources.AudioResource("Audio Clip #" + (currentDir.length + 1), decoded);
        res.orignal = orignal;
        this.currentDir.push(res);
        this.linkedPane.addElement(res);
        return res;
    }
    addResource(res) {
        this.currentDir.push(res);
        if (this.linkedPane)
            this.linkedPane.addElement(res);
        return res;
    }
    async createFileChunk() {
        let stream = new ByteStream.WriteableStream();
        stream.writeVarInt(this.resources.length);
        for (let i = 0; i < this.resources.length; i++) {
            const res = this.resources[i];
            MixeryFileFormat.Resource.writeResourceData(res, stream);
        }
        let chunk = {
            id: "ResourceStore",
            data: await stream.convertToUint8Array()
        };
        return chunk;
    }
    async readFileChunk(chunk, session) {
        let stream = new ByteStream.ReadableStream(chunk.data);
        const resourcesCount = stream.readVarInt();
        for (let i = 0; i < resourcesCount; i++) {
            let resp = MixeryFileFormat.Resource.readResourceData(stream, session);
            if (resp instanceof Promise)
                resp = await resp;
            this.addResource(resp);
        }
    }
    resetAll() {
        this.resources.forEach(res => {
            res.linkedElement?.element.remove();
        });
        this.resources = [];
        this.currentDirScope = [];
        this.selectedResource = undefined;
    }
}
ResourcesStore.SEPARATOR = "/";