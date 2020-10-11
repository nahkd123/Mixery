import { MIDINoteInfo } from "./midi.js";
import { AudioGenerator } from "./generator.js";
import { ThemeColors } from "../utils/themecolors.js";
import MixerTrack from "../mixeryaudio/mixer/track.js";

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
    mixer: MixerTrack;

    constructor(buffer: AudioBuffer, track?: MixerTrack) {
        super();
        this.buffer = buffer;
        this.mixer = track;

        const color = ThemeColors.randomClipColor();
        this.bgcolor = color[0];
        this.fgcolor = color[1];
    }
}