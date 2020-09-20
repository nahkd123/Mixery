// no it's not M$ Beats, it's a converstation between ms and beats
export function msToBeats(ms: number, bpm: number) {
    return ms * bpm / 60000;
}
export function beatsToMS(beats: number, bpm: number) {
    return beats * 60000 / bpm;
}