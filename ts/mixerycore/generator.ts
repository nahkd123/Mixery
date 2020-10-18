import { Session } from "./session.js";
import { MIDIClip } from "./clips.js";
import { beatsToMS } from "../utils/msbeats.js";
import MoveableWindow from "../windows/window.js";
import MixerTrack from "../mixeryaudio/mixer/track.js";
import RenderableGainNode from "../mixeryaudio/nodes/gain.js";
import { MIDINoteInfo } from "./midi.js";
import EnvelopeAutomation from "../mixeryaudio/automations/envelope.js";
import MIDIKeysListener from "../mididev/listener.js";

export abstract class AudioGenerator implements MIDIKeysListener {
    abstract name: string;
    abstract author: string[];
    window = new MoveableWindow("name", 0, 0, 300, 250);

    mixerTrack: MixerTrack;
    output: RenderableGainNode;

    envelopes = {
        gain: new EnvelopeAutomation(500, 0, 1, 500)
    };

    beforeLoad(session: Session) {
        this.envelopes.gain.enabled = true;

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
    playClip(clip: MIDIClip, clipOffset: number) {
        clip.notes.forEach(note => {
            this.playNote(note.note, note.sensitivity, clipOffset + note.start, note.duration);
        });
    }

    abstract playNote(note: number, sensitivity: number, offset: number, duration: number);

    //#region MIDI related
    /**
     * Send MIDI keydown event. If this method is not overrided, it will play a note for 1 beat
     * @param note The note number
     * @param sensitivity Note sensitivity
     */
    midiKeyDown(note: number, sensitivity: number) {
        this.playNote(note, sensitivity, 0, 1);
    }
    midiKeyUp(note: number) {}
    //#endregion

    stopPlayingClips() {}

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
    playNote() {}
}