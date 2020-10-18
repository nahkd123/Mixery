import MIDIDevice, { GeneralMIDIInputDevice, MIDIInputDevice } from "./device.js";
import MIDIKeysListener from "./listener.js";

export interface MIDIKeysRouting {
    inputDevice: MIDIInputDevice;
    targetChannel: number;
    listener: MIDIKeysListener;
}

export default class MIDIManager {
    inputDevices: MIDIInputDevice[] = [];
    defaultKeysListener: MIDIKeysListener;

    constructor() {}

    async addConnectedDevices() {
        let midiAccess = await navigator.requestMIDIAccess();
        Array.from(midiAccess.inputs.keys()).forEach(midiInputName => {
            const midiInput = midiAccess.inputs.get(midiInputName);
            this.addDevice(new GeneralMIDIInputDevice(midiInput, midiInputName));
        });
    }
    addDevice(device: MIDIDevice) {
        if (device instanceof MIDIInputDevice) this.inputDevices.push(device);
        device.manager = this;
    }
}