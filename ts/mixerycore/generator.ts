import { Session } from "./session.js";
import { MIDIClip } from "./clips.js";
import { beatsToMS } from "../utils/msbeats.js";
import MoveableWindow from "../windows/window.js";

export abstract class AudioGenerator {
    abstract name: string;
    abstract author: string[];
    window = new MoveableWindow("name", 0, 0, 300, 250);

    beforeLoad() {
        this.window.title.textContent = this.name;
    }
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