export default class RenderableAudioNode {
    constructor(engine) {
        this.connectedNodes = [];
        this.connectedParams = [];
        this.engine = engine;
        engine.nodes.push(this);
    }
    get isRendering() { return this.engine.renderer !== undefined; }
    get audioContext() { return this.engine.audio; }
    get renderingContext() { return this.engine.renderer; }
    connect(node) {
        if (node.engine !== this.engine)
            throw "Audio engine does not match";
        this.audioNode.connect(node.audioNode);
        if (this.isRendering)
            this.rendererNode.connect(node.rendererNode);
        this.connectedNodes.push(node);
    }
    connectParam(param) {
        this.audioNode.connect(param.audioParam);
        if (this.isRendering)
            this.audioNode.connect(param.rendererParam);
        this.connectedParams.push(param);
    }
    disconnect(node) {
        this.audioNode.disconnect(node !== undefined ? node.audioNode : undefined);
        if (this.isRendering)
            this.rendererNode.disconnect(node !== undefined ? node.rendererNode : undefined);
        if (node === undefined)
            this.connectedNodes = [];
        else
            this.connectedNodes.splice(this.connectedNodes.indexOf(node), 1);
    }
    disconnectParam(param) {
        this.audioNode.disconnect(param.audioParam);
        if (this.isRendering)
            this.rendererNode.disconnect(param.rendererParam);
        this.connectedParams.splice(this.connectedParams.indexOf(param), 1);
    }
    reconnectAll() {
        this.audioNode.disconnect();
        if (this.isRendering)
            this.rendererNode?.disconnect();
        this.connectedNodes.forEach(node => {
            this.audioNode.connect(node.audioNode);
            if (this.isRendering)
                this.rendererNode?.connect(node.rendererNode);
        });
        this.connectedParams.forEach(param => {
            this.audioNode.connect(param.audioParam);
            if (this.isRendering)
                this.rendererNode?.connect(param.rendererParam);
        });
    }
}