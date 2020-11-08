var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ThemeColors } from "../utils/themecolors.js";
import CachedAudioBuffer from "../utils/cachedaudiobuffer.js";
import AudioAutomation from "../mixeryaudio/automations/automation.js";
import { MixeryFileFormat } from "../fileformat/mixeryfile.js";
import download from "../utils/downloader.js";
export class Clip {
    constructor() {
        this.name = "Unnamed Clip";
        this.offset = 0;
        this.length = 2;
    }
    saveClip() {
        throw "Method not implemented";
    }
}
export class MIDIClip extends Clip {
    constructor(generator) {
        super();
        this.notes = [];
        this.generator = generator;
        const color = ThemeColors.randomClipColor();
        this.bgcolor = color[0];
        this.fgcolor = color[1];
    }
}
export class AudioClip extends Clip {
    constructor(buffer, track) {
        super();
        this.audioOffset = 0;
        this.buffer = buffer;
        this.cached = new CachedAudioBuffer(buffer);
        this.mixer = track;
        this.renderAudioClip = buffer.duration > 45 ? false : true;
        const color = ThemeColors.randomClipColor();
        this.bgcolor = color[0];
        this.fgcolor = color[1];
    }
    saveClip() {
        return __awaiter(this, void 0, void 0, function* () {
            let stream = yield MixeryFileFormat.Audio.convertToAudioFile(this.orignal !== undefined ? this.orignal : this.buffer, this.name);
            let blob = yield stream.convertToBlob();
            download(blob, this.name + ".mxyaudio");
        });
    }
}
export class AutomationClip extends Clip {
    constructor(param) {
        super();
        this.minValue = 0;
        this.maxValue = 1;
        this.param = param;
        this.automation = new AudioAutomation({ time: 0, type: "instant", value: 0.5 }); // Default node, yes you can't remove it
        const color = ThemeColors.randomClipColor();
        this.bgcolor = color[0];
        this.fgcolor = color[1];
    }
}