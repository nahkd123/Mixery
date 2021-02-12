import { Session } from "./session.js";
import { MIDIClip } from "./clips.js";
import { beatsToMS } from "../utils/msbeats.js";
import MoveableWindow from "../windows/window.js";
import MixerTrack from "../mixeryaudio/mixer/track.js";
import RenderableGainNode from "../mixeryaudio/nodes/gain.js";
import { MIDINoteInfo } from "./midi.js";
import EnvelopeAutomation from "../mixeryaudio/automations/envelope.js";
import MIDIKeysListener from "../mididev/listener.js";
import TabsContainer from "../mixeryui/tabs.js";
import EnvelopeEditor from "../mixeryui/automations/envelope.js";
import { updateCanvasSize } from "../mixeryui/ui.js";
import { ByteStream } from "../fileformat/filestream.js";

export abstract class AudioGenerator implements MIDIKeysListener {
    abstract name: string;
    abstract author: string[];

    private _displayName: string;
    get displayName() {return this._displayName || this.name;}
    set displayName(val: string) {this._displayName = val;}
    
    window: MoveableWindow;
    tabs: TabsContainer;
    pluginView: HTMLDivElement;
    settingsView: HTMLDivElement;

    mixerTrack: MixerTrack;
    output: RenderableGainNode;

    envelopes = {
        gain: new EnvelopeAutomation(500, 250, 1, 500)
    };

    /**
     * Override note names (which is visible in Clip Editor)
     * 
     * By default it's `undefined`, so you'll have to create a map for it before doing manuplations
     */
    noteNamesOverride: Map<number, [string, string]>;

    beforeLoad(session: Session) {
        this.window = new MoveableWindow(this.name);
        this.window.width = 300;
        this.window.height = 250;

        this.tabs = new TabsContainer(this.window.innerElement);
        this.pluginView = this.tabs.addTab("Plugin");
        this.settingsView = this.tabs.addTab("Settings", false);
        this.settingsView.style.backgroundColor = "#1b1b1b";
        this.setupSettingsView();

        // Add to master mixer track by default
        // Will add ability to change mixer track
        this.mixerTrack = session.audioEngine.mixer.master;
        this.output = session.audioEngine.createGain();
        this.output.connect(this.mixerTrack.input);
    }
    private setupSettingsView() {
        let gainEnvelope = new EnvelopeEditor(this.envelopes.gain);
        gainEnvelope.viewCanvas.style.width = "100%";
        gainEnvelope.viewCanvas.style.height = "100px";
        updateCanvasSize(gainEnvelope.viewCanvas, () => {
            gainEnvelope.renderEnvelope();
        });

        let envelopeButton = document.createElement("div");
        envelopeButton.textContent = "Envelope (Off)";
        envelopeButton.style.padding = "5px 12px";
        envelopeButton.style.color = "white";
        envelopeButton.addEventListener("click", event => {
            this.envelopes.gain.enabled = !this.envelopes.gain.enabled;
            envelopeButton.textContent = "Envelope (" + (this.envelopes.gain.enabled? "On" : "Off") + ")";
            envelopeButton.style.color = this.envelopes.gain.enabled? "black" : "white";
            envelopeButton.style.backgroundColor = this.envelopes.gain.enabled? "rgb(252, 186, 12)" : "";
        });

        this.settingsView.append(envelopeButton, gainEnvelope.viewCanvas);
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
    writePluginData(stream: ByteStream.WriteableStream) {}
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