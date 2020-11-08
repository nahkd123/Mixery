export function msToBeats(ms, bpm) {
    return ms * bpm / 60000;
}
export function beatsToMS(beats, bpm) {
    return beats * 60000 / bpm;
}