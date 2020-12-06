import { notesName } from "../mixerycore/notes.js";
import { MIDIMessagesID } from "./consts.js";
export default class MIDIDevice {
}
export class MIDIInputDevice extends MIDIDevice {
    constructor() {
        super(...arguments);
        this.routing = [];
    }
    keyDownMessage(channel, note, sensitivity) {
        this.manager.session.statusBox.innerText = this.name + "\nNote On: " + notesName[note] + ", CH " + (channel + 1);
        if (this.routing.length === 0) {
            this.manager.defaultKeysListener?.midiKeyDown(note, sensitivity);
            return;
        }
        this.routing.forEach(route => {
            if (route.targetChannel === channel)
                route.listener.midiKeyDown(note, sensitivity);
        });
    }
    keyUpMessage(channel, note) {
        this.manager.session.statusBox.innerText = this.name + "\nNote Off: " + notesName[note] + ", CH " + (channel + 1);
        if (this.routing.length === 0) {
            this.manager.defaultKeysListener?.midiKeyUp(note);
            return;
        }
        this.routing.forEach(route => {
            if (route.targetChannel === channel)
                route.listener.midiKeyUp(note);
        });
    }
}
export class GeneralMIDIInputDevice extends MIDIInputDevice {
    constructor(realDevice, altName) {
        super();
        this.realDevice = realDevice;
        this.name = realDevice.name || altName;
        realDevice.open();
        realDevice.addEventListener("midimessage", event => {
            const data = event.data;
            const status = data[0] >> 4;
            const channel = data[0] & 0x0F;
            const note = data[1] & 0b01111111;
            const sensitivity = (data[2] & 0b01111111) / 127;
            switch (status) {
                case MIDIMessagesID.NOTE_ON:
                    this.keyDownMessage(channel, note, sensitivity);
                    break;
                case MIDIMessagesID.NOTE_OFF:
                    this.keyUpMessage(channel, note);
                    break;
            }
        });
    }
}