import { notesName } from "../mixerycore/notes.js";
import { MIDIMessagesID } from "./consts.js";
import MIDIManager, { MIDIKeysRouting } from "./manager.js";

export default abstract class MIDIDevice {
    name: string;
    manager: MIDIManager;
}

export abstract class MIDIInputDevice extends MIDIDevice {
    routing: MIDIKeysRouting[] = [];
    
    keyDownMessage(channel: number, note: number, sensitivity: number) {
        this.manager.session.statusBox.innerText = this.name + "\nNote On: " + notesName[note] + ", CH " + (channel + 1);

        if (this.routing.length === 0) {
            this.manager.defaultKeysListener?.midiKeyDown(note, sensitivity);
            return;
        }
        this.routing.forEach(route => {
            if (route.targetChannel === channel) route.listener.midiKeyDown(note, sensitivity);
        });
    }
    keyUpMessage(channel: number, note: number) {
        this.manager.session.statusBox.innerText = this.name + "\nNote Off: " + notesName[note] + ", CH " + (channel + 1);

        if (this.routing.length === 0) {
            this.manager.defaultKeysListener?.midiKeyUp(note);
            return;
        }
        this.routing.forEach(route => {
            if (route.targetChannel === channel) route.listener.midiKeyUp(note);
        });
    }
}

export class GeneralMIDIInputDevice extends MIDIInputDevice {
    realDevice: MIDIInput;

    constructor(realDevice: MIDIInput, altName: string) {
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
                case MIDIMessagesID.NOTE_ON: this.keyDownMessage(channel, note, sensitivity); break;
                case MIDIMessagesID.NOTE_OFF: this.keyUpMessage(channel, note); break;
            }
        });
    }
}
