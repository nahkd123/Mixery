var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GeneralMIDIInputDevice, MIDIInputDevice } from "./device.js";
export default class MIDIManager {
    constructor(session) {
        this.inputDevices = [];
        this.session = session;
    }
    addConnectedDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!navigator.requestMIDIAccess) {
                console.warn("This browser is missing requestMIDIAccess (a.k.a does not supported MIDI devices yet). Consider using Chrome 43+ for more features");
                return;
            }
            let midiAccess = yield navigator.requestMIDIAccess();
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
        });
    }
    addDevice(device) {
        if (device instanceof MIDIInputDevice)
            this.inputDevices.push(device);
        device.manager = this;
    }
}