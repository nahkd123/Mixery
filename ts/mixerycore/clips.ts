import { MIDINoteInfo } from "./midi.js";
import { AudioGenerator } from "./generator.js";
import { ThemeColors } from "../utils/themecolors.js";
import MixerTrack from "../mixeryaudio/mixer/track.js";
import CachedAudioBuffer from "../utils/cachedaudiobuffer.js";
import AudioAutomation, { AutomationNode } from "../mixeryaudio/automations/automation.js";
import RenderableAudioParam from "../mixeryaudio/automations/param.js";

export abstract class Clip {
    name: string = "Unnamed Clip";
    bgcolor: string;
    fgcolor: string;

    offset: number = 0;
    length: number = 2;
}

export class MIDIClip extends Clip {
    notes: MIDINoteInfo[] = [];
    generator: AudioGenerator;

    constructor(generator: AudioGenerator) {
        super();
        this.generator = generator;

        const color = ThemeColors.randomClipColor();
        this.bgcolor = color[0];
        this.fgcolor = color[1];
    }
}

export class AudioClip extends Clip {
    buffer: AudioBuffer;
    cached: CachedAudioBuffer;
    audioOffset: number = 0;
    mixer: MixerTrack;

    renderAudioClip: boolean;

    constructor(buffer: AudioBuffer, track?: MixerTrack) {
        super();
        this.buffer = buffer;
        this.cached = new CachedAudioBuffer(buffer);
        this.mixer = track;

        this.renderAudioClip = buffer.duration > 45? false : true;

        const color = ThemeColors.randomClipColor();
        this.bgcolor = color[0];
        this.fgcolor = color[1];
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