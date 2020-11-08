/**
 * Cached notes name
 */
export let notesName = [];
/**
 * Cached notes frequency
 */
export let notesFrequency = [];
/**
 * A map where the note name is the key
 */
export let notesIndex = new Map();
export var NotesConfiguration;
(function (NotesConfiguration) {
    NotesConfiguration.BASE_FREQUENCY = 440;
    NotesConfiguration.BASE_NOTE = 57;
    NotesConfiguration.NOTE_FROM = 0;
    NotesConfiguration.NOTE_TO = 131;
    NotesConfiguration.NOTE_NAMING = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    NotesConfiguration.VAR_A = Math.pow(2, 1 / NotesConfiguration.NOTE_NAMING.length);
    NotesConfiguration.ROUND_FREQUENCIES = true;
})(NotesConfiguration || (NotesConfiguration = {}));
/**
 * Generate the note name. This function does not uses cached values, and using it might reduce the
 * performance.
 * @param index The note index
 */
export function generateNoteName(index = 0) {
    return NotesConfiguration.NOTE_NAMING[index % NotesConfiguration.NOTE_NAMING.length] + Math.floor(index / 12);
}
/**
 * Generate the node index. This function does not uses cached values, and using it might casue huge
 * performance drop, due to the Math.pow operation.
 * @param index The note index
 */
export function generateNoteFrequency(index = 0) {
    return NotesConfiguration.BASE_FREQUENCY * Math.pow(NotesConfiguration.VAR_A, index - NotesConfiguration.BASE_NOTE);
}
for (let i = NotesConfiguration.NOTE_FROM; i <= NotesConfiguration.NOTE_TO; i++) {
    let name = notesName[i] = generateNoteName(i);
    let freq = generateNoteFrequency(i);
    notesFrequency[i] = NotesConfiguration.ROUND_FREQUENCIES ? Math.round(freq) : freq;
    notesIndex.set(name, i);
}