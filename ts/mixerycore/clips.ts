import { MIDINoteInfo } from "./midi.js";
import { AudioGenerator } from "./generator.js";
import { ThemeColors } from "../utils/themecolors.js";

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

        // Will remove soon!
        this.notes.push(
            {note: 47, sensitivity: 0.75, start: 0.00, duration: 0.25},
            {note: 49, sensitivity: 0.75, start: 0.25, duration: 0.25},
            {note: 55, sensitivity: 0.75, start: 0.50, duration: 0.25}
        );
    }
}