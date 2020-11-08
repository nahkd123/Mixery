export default class AudioParamsAutomation {
    constructor(engine) {
        this.engine = engine;
    }
    get isRendering() { return this.engine.renderer !== undefined; }
    get audioContext() { return this.engine.audio; }
    get renderingContext() { return this.engine.renderer; }
    beforeRender() { }
    setValueAtTime(start, val) {
        this.audioParam.setValueAtTime(val, start);
        if (this.isRendering)
            this.rendererParam.setValueAtTime(val, start);
    }
    setValueAtNextTime(start, val) {
        this.audioParam.setValueAtTime(val, this.engine.audio.currentTime + start);
        if (this.isRendering)
            this.rendererParam.setValueAtTime(val, this.engine.renderer.currentTime + start);
    }
    linearRampToValueAtTime(endTime, val) {
        this.audioParam.linearRampToValueAtTime(val, endTime);
        if (this.isRendering)
            this.rendererParam.linearRampToValueAtTime(val, endTime);
    }
    linearRampToValueAtNextTime(endTime, val) {
        this.audioParam.linearRampToValueAtTime(val, this.engine.audio.currentTime + endTime);
        if (this.isRendering)
            this.rendererParam.linearRampToValueAtTime(val, this.engine.renderer.currentTime + endTime);
    }
    cancelScheduledValues(cancelTime) {
        this.audioParam.cancelScheduledValues(cancelTime);
        if (this.isRendering)
            this.rendererParam.cancelScheduledValues(cancelTime);
    }
    cancelAndHoldAtValue(cancelTime) {
        this.audioParam.cancelAndHoldAtTime(cancelTime);
        if (this.isRendering)
            this.rendererParam.cancelAndHoldAtTime(cancelTime);
    }
    get value() { return this.audioParam.value; }
    set value(val) { this.audioParam.value = val; }
    get defaultValue() { return this.audioParam.defaultValue; }
}