export var MIDIMessagesID;
(function (MIDIMessagesID) {
    MIDIMessagesID.NOTE_OFF = 0b1000;
    MIDIMessagesID.NOTE_ON = 0b1001;
    MIDIMessagesID.POLYPHONIC_KEY_PRESSURE = 0b1010;
    MIDIMessagesID.CONTROL_CHANGE = 0b1011;
    MIDIMessagesID.PROGRAM_CHANGE = 0b1100;
})(MIDIMessagesID || (MIDIMessagesID = {}));