import { Session } from "./session.js";
import { MIDIClip } from "./clips.js";
import { beatsToMS } from "../utils/msbeats.js";
import MoveableWindow from "../windows/window.js";
import { MixerTrack } from "../mixerycanvas/mixer.js";

export abstract class AudioGenerator {
    abstract name: string;
    abstract author: string[];
    window = new MoveableWindow("name", 0, 0, 300, 250);

    mixerTrack: MixerTrack;
    gain: GainNode;

    beforeLoad(session: Session) {
        this.window.title.textContent = this.name;

        // Add to master mixer track by default
        // Will add ability to change mixer track
        this.mixerTrack = session.audioEngine.master;
        this.gain = session.audioEngine.createGain();
        this.gain.gain.value = 1.0;
        this.gain.connect(this.mixerTrack.input);
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