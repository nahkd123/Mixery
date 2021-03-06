import CachedAudioBuffer from "./cachedaudiobuffer";

function msToFrame(ms: number, rate = 44100) {
    return Math.floor(rate * ms / 1000);
}
function getFrameIndexByPixel(width: number, pixel = 0, start = 0, end = 44100) {
    const range = end - start;
    return Math.floor(start + (range * pixel / width));
}
function getFramesCountPerPixel(width: number, range = 44100) {
    return range / width;
}
function getPeekByPixel(buffer: Float32Array, width: number, pixel = 0, start = 0, end = 44100) {
    const frameIndex = getFrameIndexByPixel(width, pixel, start, end);
    const framesCountPerPX = getFramesCountPerPixel(width, end - start);
    let val = Math.abs(buffer[frameIndex] || 0);
    for (let i = 0; i < framesCountPerPX; i++) val = Math.max(val, Math.abs(buffer[frameIndex + i] || 0));
    return val;
}

export default function drawAudioBuffer(buffer: CachedAudioBuffer, ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, bufferStart: number, bufferEnd: number, pathLined = () => {}, flipChannels = true) {
    const heightPerChannel = h / buffer.numberOfChannels;
    const startFrame = msToFrame(bufferStart, buffer.sampleRate);
    const endFrame = msToFrame(bufferEnd, buffer.sampleRate);
    const realWidth = ctx.canvas.width;

    for (let i = 0; i < buffer.numberOfChannels; i++) {
        const channel = buffer.getChannelData(i);
        const bottomDirection = flipChannels? (i % 2) ^ 1 : 1;

        ctx.beginPath();
        ctx.moveTo(x, y + (i + bottomDirection) * heightPerChannel);

        let previousPeak = 0;
        for (let dx = 0; dx < w; dx++) {
            if (x + dx < 0) continue;
            
            // const peak = Math.abs(channel[getFrameIndexByPixel(w, dx, startFrame, endFrame)] || 0);
            const peak = getPeekByPixel(channel, w, dx, startFrame, endFrame);
            const renderPeak = previousPeak * 0.5 + peak * 0.5;
            if (x + dx > realWidth) {
                ctx.lineTo(x + dx, y + (i + bottomDirection) * heightPerChannel);
                break;
            }
            ctx.lineTo(x + dx, y + (i + (bottomDirection === 1? 1 - renderPeak : renderPeak)) * heightPerChannel);

            previousPeak = peak;
        }
        pathLined();
        ctx.closePath();
    }
}