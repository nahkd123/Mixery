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
    constructor(midi, generator) {
        super();
        this.midi = midi;
        this.generator = generator;
        const color = ThemeColors.randomClipColor();
        this.bgcolor = color[0];
        this.fgcolor = color[1];
    }
    get notes() { return this.midi.notes; }
}
export class AudioClip extends Clip {
    constructor(audio, track) {
        super();
        this.audioOffset = 0;
        this.audio = audio;
        this.cached = new CachedAudioBuffer(this.buffer);
        this.mixer = track;
        this.renderAudioClip = this.buffer.duration > 45 ? false : true;
        const color = ThemeColors.randomClipColor();
        this.bgcolor = color[0];
        this.fgcolor = color[1];
    }
    get buffer() { return this.audio.decoded; }
    get orignal() { return this.audio.orignal; }
    async saveClip() {
        let stream = await MixeryFileFormat.Audio.convertToAudioFile(this.orignal !== undefined ? this.orignal : this.buffer, this.name);
        let blob = await stream.convertToBlob();
        download(blob, this.name + ".mxyaudio");
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