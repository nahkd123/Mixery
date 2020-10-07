import RenderableAudioParam from "./param";

export type AutomationNodeType = "instant" | "linearRamp" | "exponentialRamp";

export interface AutomationNode {
    time: number;
    value: number;
    type: AutomationNodeType;
}

export default class AudioAutomation {
    nodes: AutomationNode[];

    constructor(...nodes: AutomationNode[]) {
        this.nodes = nodes;
    }

    addNode(type: AutomationNodeType, time: number, value: number) {
        let node = {type, time, value};
        this.nodes.push(node);
        this.rearrange();
        return node;
    }

    rearrange() {this.nodes.sort((a, b) => (a.time - b.time));}

    /**
     * Apply the automation to audio param
     * @param param The audio param to apply
     * @param mul The value to multiply by (Ex: -1 will result reversed automation)
     * @param offset The automation offset from current time
     */
    apply(param: RenderableAudioParam, mul = 1, offset = 0) {
        this.nodes.forEach(node => {
            if (node.type === "instant") param.setValueAtNextTime(offset + node.time, node.value * mul);
            if (node.type === "linearRamp") param.linearRampToValueAtNextTime(offset + node.time, node.value * mul);
        });
    }
}