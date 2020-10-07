import { Session } from "./session.js";
import { MIDIClip } from "./clips.js";
import { beatsToMS } from "../utils/msbeats.js";
import MoveableWindow from "../windows/window.js";
import MixerTrack from "../mixeryaudio/mixer/track.js";
import RenderableGainNode from "../mixeryaudio/nodes/gain.js";

export abstract class AudioGenerator {
    abstract name: string;
    abstract author: string[];
    window = new MoveableWindow("name", 0, 0, 300, 250);

    mixerTrack: MixerTrack;
    output: RenderableGainNode;

    beforeLoad(session: Session) {
        this.window.title.textContent = this.name;

        // Add to master mixer track by default
        // Will add ability to change mixer track
        this.mixerTrack = session.audioEngine.mixer.master;
        this.output = session.audioEngine.createGain();
        this.output.connect(this.mixerTrack.input);
    }
    abstract generatorLoad(session: Session, output: RenderableGainNode);
    /**
     * Play the MIDI clip
     * @param clip The MIDI clip
     * @param clipOffset The clip offset in beats
     */
    abstract playClip(clip: MIDIClip, clipOffset: number);

    /**
     * Get the plugin current configuration. It can be used to save plugin preset for later use.
     */
    getConfiguration() {
        return {};
    }

    /**
     * Get the plugin preset, includes the current configuration
     */
    getPluginPreset() {
        return {
            type: "generator",
            name: this.name,
            configuration: this.getConfiguration()
        };
    }
}

export class ExampleGenerator extends AudioGenerator {
    name = "Example Generator";
    author = ["nahkd123"];

    session: Session;
    generatorLoad(session: Session, output: RenderableGainNode) {
        this.session = session;
    }
    playClip(clip: MIDIClip, clipOffset: number) {
        // console.log(clip, clipOffset);
    }
}