import { beatsToMS } from "../../utils/msbeats.js";
export default class AudioAutomation {
    constructor(...nodes) {
        this.nodes = nodes;
    }
    addNode(type, time, value) {
        let node = { type, time, value };
        this.nodes.push(node);
        this.rearrange();
        return node;
    }
    rearrange() { this.nodes.sort((a, b) => (a.time - b.time)); }
    /**
     * Apply the automation to audio param
     * @param param The audio param to apply
     * @param mul The value to multiply by (Ex: -1 will result reversed automation)
     * @param offset The automation offset from current time
     */
    apply(param, mul = 1, offset = 0) {
        this.nodes.forEach(node => {
            if (node.type === "instant")
                param.setValueAtNextTime(offset + node.time, node.value * mul);
            if (node.type === "linearRamp")
                param.linearRampToValueAtNextTime(offset + node.time, node.value * mul);
        });
    }
    applyBPM(param, bpm = 120, mul = 1, offset = 0) {
        this.nodes.forEach(node => {
            if (node.type === "instant")
                param.setValueAtNextTime(beatsToMS(offset + node.time, bpm) / 1000, node.value * mul);
            if (node.type === "linearRamp")
                param.linearRampToValueAtNextTime(beatsToMS(offset + node.time, bpm) / 1000, node.value * mul);
        });
    }
}