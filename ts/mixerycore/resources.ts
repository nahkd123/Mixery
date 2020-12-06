import { ByteStream } from "../fileformat/filestream.js";
import { MixeryFileChunk, MixeryFileFormat } from "../fileformat/mixeryfile.js";
import { ResourceElement, ResourcesPane } from "../mixeryui/ui/resources.js";
import { MIDINoteInfo } from "./midi.js";
import { Session } from "./session.js";

export namespace Resources {
    export abstract class Resource {
        _name: string;
        get name() {return this._name;}
        set name(val: string) {
            this._name = val;
            if (this.linkedElement) this.linkedElement.element.querySelector("div.resname").textContent = val;
        }

        linkedElement?: ResourceElement;

        constructor(name: string) {
            this._name = name;
        }
    }

    export class CompoundResource extends Resource {
        children: Resource[] = [];
    }

    export class AudioResource extends Resource {
        decoded: AudioBuffer;
        orignal: ArrayBuffer;

        constructor(name: string, decoded: AudioBuffer) {
            super(name);
            this.decoded = decoded;
        }
    }

    export class MIDIResource extends Resource {
        notes: MIDINoteInfo[] = [];
        get actualLength() {
            if (this.notes.length === 0) return 0;

            this.notes.sort((a, b) => a.start - b.start);
            let targetNote = this.notes[this.notes.length - 1];
            return targetNote.start + targetNote.duration;
        }
        get noteRange() {
            let min = -1;
            let max = -1;
            this.notes.forEach(note => {
                if (min === -1 || note.note < min) min = note.note;
                if (max === -1 || note.note > max) max = note.note;
            });
            return [min, max];
        }
    }
}

function search(resources: Resources.Resource[], kwd: string) {
    for (let i = 0; i < resources.length; i++) if (resources[i]._name === kwd) return resources[i];
    return undefined;
}

export default class ResourcesStore {
    // Constants
    static readonly SEPARATOR = "/";

    // Temporary Data
    currentDirScope: string[] = [];
    selectedResource: Resources.Resource = undefined;
    linkedPane: ResourcesPane;

    // Data (will be saved)
    resources: Resources.Resource[] = [];

    // Getters/Setters
    get currentDir() {
        let current = this.resources;
        this.currentDirScope.forEach(name => {
            let next = search(current, name);
            if (next === undefined) throw "Unknown path";
            else if (next instanceof Resources.CompoundResource) current = next.children;
            else throw name + " is not a resource compound/directory";
        });

        return current;
    }

    dirScopeToPath() {
        return "/" + this.currentDirScope.join("/");
    }
    pathToDirScope(path: string) {
        if (!path.startsWith("/")) throw "The path must contains root level directory (Ex: /a/b/c instead of a/b/c)";

        path = path.substr(1, path.length - 1 - (path.endsWith("/")? 1 : 0));
        this.currentDirScope = path.split("/");
    }

    newMIDIResource() {
        let currentDir = this.currentDir;
        let res = new Resources.MIDIResource("MIDI Clip #" + (currentDir.length + 1));
        this.selectedResource = res;
        return <Resources.MIDIResource> this.addResource(res);
    }

    newAudioResource(decoded: AudioBuffer, orignal?: ArrayBuffer) {
        let currentDir = this.currentDir;
        let res = new Resources.AudioResource("Audio Clip #" + (currentDir.length + 1), decoded);
        res.orignal = orignal;
        this.currentDir.push(res);
        this.linkedPane.addElement(res);
        return res;
    }

    addResource(res: Resources.Resource) {
        this.currentDir.push(res);
        if (this.linkedPane) this.linkedPane.addElement(res);
        return res;
    }

    async createFileChunk() {
        let stream = new ByteStream.WriteableStream();
        stream.writeVarInt(this.resources.length);
        for (let i = 0 ; i < this.resources.length; i++) {
            const res = this.resources[i];
            MixeryFileFormat.Resource.writeResourceData(res, stream);
        }

        let chunk: MixeryFileChunk = {
            id: "ResourceStore",
            data: await stream.convertToUint8Array()
        };
        return chunk;
    }

    async readFileChunk(chunk: MixeryFileChunk, session?: Session) {
        let stream = new ByteStream.ReadableStream(chunk.data);
        const resourcesCount = stream.readVarInt();

        for (let i = 0; i < resourcesCount; i++) {
            let resp = MixeryFileFormat.Resource.readResourceData(stream, session);
            if (resp instanceof Promise) resp = await resp;

            this.addResource(resp);
        }
    }

    resetAll() {
        // Delete stuffs and GUI components
        this.resources.forEach(res => {
            res.linkedElement?.element.remove();
        });
        this.resources = [];
        this.currentDirScope = [];
        this.selectedResource = undefined;
    }
}