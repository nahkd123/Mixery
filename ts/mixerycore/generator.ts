import { Session } from "./session.js";
import { MIDIClip } from "./clips.js";
import { beatsToMS } from "../utils/msbeats.js";

export abstract class AudioGenerator {
    abstract name: string;
    abstract author: string[];

    abstract generatorLoad(session: Session, output: AudioNode);
    /**
     * Play the MIDI clip
     * @param clip The MIDI clip
     * @param clipOffset The clip offset in beats
     */
    abstract playClip(clip: MIDIClip, clipOffset: number);
}

export class ExampleGenerator extends AudioGenerator {
    name = "Example Generator";
    author = ["nahkd123"];

    session: Session;
    generatorLoad(session: Session, output: AudioNode) {
        this.session = session;
    }
    playClip(clip: MIDIClip, clipOffset: number) {
        // console.log(clip, clipOffset);
    }
}