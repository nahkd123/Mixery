export default interface MIDIKeysListener {
    /**
     * Send MIDI keyup event.
     * @param note The note number
     * @param sensitivity The note sensitivity
     */
    midiKeyDown(note: number, sensitivity: number);

    /**
     * Send MIDI keyup event.
     * @param note The note number
     */
    midiKeyUp(note: number);
}