import MoveableWindow from "../windows/window.js";
import EnvelopeAutomation from "../mixeryaudio/automations/envelope.js";
import TabsContainer from "../mixeryui/tabs.js";
import EnvelopeEditor from "../mixeryui/automations/envelope.js";
import { updateCanvasSize } from "../mixeryui/ui.js";
export class AudioGenerator {
    constructor() {
        this.envelopes = {
            gain: new EnvelopeAutomation(500, 250, 1, 500)
        };
    }
    get displayName() { return this._displayName || this.name; }
    set displayName(val) { this._displayName = val; }
    beforeLoad(session) {
        this.window = new MoveableWindow(this.name);
        this.window.width = 300;
        this.window.height = 250;
        this.tabs = new TabsContainer(this.window.innerElement);
        this.pluginView = this.tabs.addTab("Plugin");
        this.settingsView = this.tabs.addTab("Settings", false);
        this.settingsView.style.backgroundColor = "#1b1b1b";
        this.setupSettingsView();
        this.mixerTrack = session.audioEngine.mixer.master;
        this.output = session.audioEngine.createGain();
        this.output.connect(this.mixerTrack.input);
    }
    setupSettingsView() {
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
            envelopeButton.textContent = "Envelope (" + (this.envelopes.gain.enabled ? "On" : "Off") + ")";
            envelopeButton.style.color = this.envelopes.gain.enabled ? "black" : "white";
            envelopeButton.style.backgroundColor = this.envelopes.gain.enabled ? "rgb(252, 186, 12)" : "";
        });
        this.settingsView.append(envelopeButton, gainEnvelope.viewCanvas);
    }
    /**
     * Play the MIDI clip
     * @param clip The MIDI clip
     * @param clipOffset The clip offset in beats
     */
    playClip(clip, clipOffset) {
        clip.notes.forEach(note => {
            this.playNote(note.note, note.sensitivity, clipOffset + note.start, note.duration);
        });
    }
    /**
     * Send MIDI keydown event. If this method is not overrided, it will play a note for 1 beat
     * @param note The note number
     * @param sensitivity Note sensitivity
     */
    midiKeyDown(note, sensitivity) {
        this.playNote(note, sensitivity, 0, 1);
    }
    midiKeyUp(note) { }
    stopPlayingClips() { }
    /**
     * Get the plugin current configuration. It can be used to save plugin preset for later use.
     */
    writePluginData(stream) { }
}
export class ExampleGenerator extends AudioGenerator {
    constructor() {
        super(...arguments);
        this.name = "Example Generator";
        this.author = ["nahkd123"];
    }
    generatorLoad(session, output) {
        this.session = session;
    }
    playNote() { }
}