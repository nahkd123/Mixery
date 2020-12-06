import { MIDINoteInfo } from "./midi.js";

export namespace Resources {
    export abstract class Resource {
        name: string;

        constructor(name: string) {
            this.name = name;
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
    }
}

function search(resources: Resources.Resource[], kwd: string) {
    for (let i = 0; i < resources.length; i++) if (resources[i].name === kwd) return resources[i];
    return undefined;
}

export default class ResourcesStore {
    // Constants
    static readonly SEPARATOR = "/";

    // Temporary Data
    currentDirScope: string[] = [];
    selectedResource: Resources.Resource = undefined;

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
        currentDir.push(res);
        this.selectedResource = res;
        return res;
    }
}