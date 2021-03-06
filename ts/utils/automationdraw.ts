import AudioAutomation from "../mixeryaudio/automations/automation.js";
import { AutomationClip } from "../mixerycore/clips.js";

export default function drawAutomation(automation: AutomationClip, ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, beatsPerPixel: number = 100, noExtends: boolean = false, drawCircles: boolean = false) {
    const range = automation.maxValue - automation.minValue;
    const base = automation.maxValue / range;

    ctx.beginPath();
    let oldPeekY = 0;
    automation.automation.nodes.forEach((node, index) => {
        const displayValue = base - node.value / range;
        const timeX = x + node.time * beatsPerPixel;
        const peekY = y + displayValue * h;
        if (index === 0) ctx.moveTo(timeX, peekY);
        else {
            if (node.type === "instant") {
                ctx.lineTo(timeX, oldPeekY);
                ctx.lineTo(timeX, peekY);
            } else if (node.type === "linearRamp") ctx.lineTo(timeX, peekY);
        }
        oldPeekY = peekY;
    });
    if (!noExtends) ctx.lineTo(x + w, oldPeekY);
    ctx.stroke();
    ctx.closePath();

    if (drawCircles) automation.automation.nodes.forEach((node, index) => {
        const displayValue = base - node.value / range;
        const timeX = x + node.time * beatsPerPixel;
        const peekY = y + displayValue * h;
        
        ctx.translate(timeX, peekY);
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
        ctx.translate(-timeX, -peekY);
    });
}