export function snap(val: number, ...vas: number[]) {
    let sel = 0;
    const hval = Math.floor(val);
    const vval = val - hval;
    vas.forEach(sval => {
        if (vval >= sval) sel = sval;
    });
    return hval + sel;
}
export function fixedSnap(val: number, segment: number) {
    return Math.floor(val / segment) * segment;
}
export function fixedSnapCeil(val: number, segment: number) {
    return Math.ceil(val / segment) * segment;
}

export const BeatSnapPreset = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];