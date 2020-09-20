/**
 * Cached notes name
 */
export let notesName: string[] = [];

/**
 * Cached notes frequency
 */
export let notesFrequency: number[] = [];

/**
 * A map where the note name is the key
 */
export let notesIndex = new Map<string, number>();

export namespace NotesConfiguration {
    export const BASE_FREQUENCY = 440;
    export const BASE_NOTE = 57;
    export const NOTE_FROM = 0;
    export const NOTE_TO = 131;
    export const NOTE_NAMING = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    export const VAR_A = Math.pow(2, 1 / NOTE_NAMING.length);
}

/**
 * Generate the note name. This function does not uses cached values, and using it might reduce the
 * performance.
 * @param index The note index
 */
export function generateNoteName(index: number = 0) {
    return NotesConfiguration.NOTE_NAMING[index % NotesConfiguration.NOTE_NAMING.length] + Math.floor(index / 12);
}

/**
 * Generate the node index. This function does not uses cached values, and using it might casue huge
 * performance drop, due to the Math.pow operation.
 * @param index The note index
 */
export function generateNoteFrequency(index: number = 0) {
    return NotesConfiguration.BASE_FREQUENCY * Math.pow(NotesConfiguration.VAR_A, index - NotesConfiguration.BASE_NOTE);
}

for (let i = NotesConfiguration.NOTE_FROM; i <= NotesConfiguration.NOTE_TO; i++) {
    let name = notesName[i] = generateNoteName(i);
    notesFrequency[i] = generateNoteFrequency(i);
    notesIndex.set(name, i);
}
