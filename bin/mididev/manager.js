import { GeneralMIDIInputDevice, MIDIInputDevice } from "./device.js";
export default class MIDIManager {
    constructor(session) {
        this.inputDevices = [];
        this.session = session;
    }
    async addConnectedDevices() {
        if (!navigator.requestMIDIAccess) {
            console.warn("This browser is missing requestMIDIAccess (a.k.a does not supported MIDI devices yet). Consider using Chrome 43+ for more features");
            return;
        }
        let midiAccess = await navigator.requestMIDIAccess();
        let midiInputDevices = Array.from(midiAccess.inputs.keys());
        midiInputDevices.forEach(midiInputName => {
            const midiInput = midiAccess.inputs.get(midiInputName);
            this.addDevice(new GeneralMIDIInputDevice(midiInput, midiInputName));
        });
        if (this.inputDevices.length === 0)
            this.session.statusBox.textContent = "No MIDI device found";
        else if (this.inputDevices.length === 1)
            this.session.statusBox.textContent = "Found " + this.inputDevices[0].name + " MIDI device";
        else
            this.session.statusBox.textContent = "Found " + this.inputDevices.length + " MIDI devices";
    }
    addDevice(device) {
        if (device instanceof MIDIInputDevice)
            this.inputDevices.push(device);
        device.manager = this;
    }
}