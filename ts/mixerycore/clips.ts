import { MIDINoteInfo } from "./midi.js";
import { AudioGenerator } from "./generator.js";
import { ThemeColors } from "../utils/themecolors.js";
import MixerTrack from "../mixeryaudio/mixer/track.js";
import CachedAudioBuffer from "../utils/cachedaudiobuffer.js";
import AudioAutomation, { AutomationNode } from "../mixeryaudio/automations/automation.js";
import RenderableAudioParam from "../mixeryaudio/automations/param.js";
import { MixeryFileFormat } from "../fileformat/mixeryfile.js";
import download from "../utils/downloader.js";
import { Resources } from "./resources.js";

export abstract class Clip {
    name: string = "Unnamed Clip";
    bgcolor: string;
    fgcolor: string;

    offset: number = 0;
    length: number = 2;

    saveClip() {
        throw "Method not implemented";
    }
}

export class MIDIClip extends Clip {
    midi: Resources.MIDIResource;
    get notes() {return this.midi.notes;}
    generator: AudioGenerator;

    constructor(midi: Resources.MIDIResource, generator: AudioGenerator) {
        super();
        this.midi = midi;
        this.generator = generator;

        const color = ThemeColors.randomClipColor();
        this.bgcolor = color[0];
        this.fgcolor = color[1];
    }

    getNoteAt(n: number, offset: number) {
        const notes = this.notes;
        for (let i = 0; i < notes.length; i++) if (n === notes[i].note && offset >= notes[i].start && offset < notes[i].start + notes[i].duration) return notes[i];
        return undefined;
    }
}

export class AudioClip extends Clip {
    audio: Resources.AudioResource;
    get buffer() {return this.audio.decoded;}
    get orignal() {return this.audio.orignal;}
    cached: CachedAudioBuffer;
    audioOffset: number = 0;
    mixer: MixerTrack;

    renderAudioClip: boolean;

    constructor(audio: Resources.AudioResource, track?: MixerTrack) {
        super();
        this.audio = audio;
        this.cached = new CachedAudioBuffer(this.buffer);
        this.mixer = track;

        this.renderAudioClip = this.buffer.duration > 45? false : true;

        const color = ThemeColors.randomClipColor();
        this.bgcolor = color[0];
        this.fgcolor = color[1];
    }

    async saveClip() {
        let stream = await MixeryFileFormat.Audio.convertToAudioFile(this.orignal !== undefined? this.orignal : this.buffer, this.name);
        let blob = await stream.convertToBlob();
        download(blob, this.name + ".mxyaudio");
    }
}

export class AutomationClip extends Clip {
    automation: AudioAutomation;
    param: RenderableAudioParam;
    minValue: number = 0;
    maxValue: number = 1;

    constructor(param: RenderableAudioParam) {
        super();
        this.param = param;
        this.automation = new AudioAutomation({time: 0, type: "instant", value: 0.5}); // Default node, yes you can't remove it

        const color = ThemeColors.randomClipColor();
        this.bgcolor = color[0];
        this.fgcolor = color[1];
    }
}