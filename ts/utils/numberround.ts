export function numberRounder(val: number, place: number = 2) {
    const firstPart = Math.floor(val);
    let decPart = Math.floor((val - firstPart) * Math.pow(10, place)) + "";
    while (decPart.length < place) decPart += "0";

    return firstPart + "." + decPart;
}

export function addZeros(val: number, zeros: number) {
    let out = val + "";
    while (out.length < zeros) out = "0" + out;
    return out;
}

export function msToString(ms: number) {
    ms = Math.floor(ms);

    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    
    let dMS = addZeros(ms % 1000, 3);
    let dSecs = addZeros(secs % 60, 2);
    let dMins = addZeros(mins % 60, 2);

    return addZeros(hours, 2) + ":" + dMins + ":" + dSecs + "." + dMS;
}