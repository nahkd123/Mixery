function msToFrame(ms: number, rate = 44100) {
    return Math.floor(rate * ms / 1000);
}
function getFrameIndexByPixel(width: number, pixel: number = 0, start: number = 0, end: number = 44100) {
    const range = end - start;
    return Math.floor(start + (range * pixel / width));
}

export default function drawAudioBuffer(buffer: AudioBuffer, ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, bufferStart: number, bufferEnd: number) {
    const heightPerChannel = h / buffer.numberOfChannels;
    const startFrame = msToFrame(bufferStart, buffer.sampleRate);
    const endFrame = msToFrame(bufferEnd, buffer.sampleRate);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
        const channel = buffer.getChannelData(i);
        const bottomDirection = (i % 2) ^ 1;

        ctx.beginPath();
        ctx.moveTo(x, y + i * heightPerChannel);
        for (let dx = 0; dx < w; dx++) {
            const peak = Math.abs(channel[getFrameIndexByPixel(w, dx, startFrame, endFrame)] || 0);
            ctx.lineTo(x + dx, y + (i + (bottomDirection === 1? 1 - peak : peak)) * heightPerChannel);
        }
        ctx.stroke();
        ctx.closePath();
    }
}