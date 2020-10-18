import MixeryAudioEngine from "../engine.js";

export default abstract class AudioParamsAutomation {
    engine: MixeryAudioEngine;
    get isRendering() {return this.engine.renderer !== undefined;}
    get audioContext() {return this.engine.audio;}
    get renderingContext() {return this.engine.renderer;}
    
    audioParam: AudioParam;
    rendererParam: AudioParam;

    constructor(engine: MixeryAudioEngine) {
        this.engine = engine;
    }

    beforeRender() {}

    setValueAtTime(start: number, val: number) {
        this.audioParam.setValueAtTime(val, start);
        if (this.isRendering) this.rendererParam.setValueAtTime(val, start);
    }
    setValueAtNextTime(start: number, val: number) {
        this.audioParam.setValueAtTime(val, this.engine.audio.currentTime + start);
        if (this.isRendering) this.rendererParam.setValueAtTime(val, this.engine.renderer.currentTime + start);
    }

    linearRampToValueAtTime(endTime: number, val: number) {
        this.audioParam.linearRampToValueAtTime(val, endTime);
        if (this.isRendering) this.rendererParam.linearRampToValueAtTime(val, endTime);
    }
    linearRampToValueAtNextTime(endTime: number, val: number) {
        this.audioParam.linearRampToValueAtTime(val, this.engine.audio.currentTime + endTime);
        if (this.isRendering) this.rendererParam.linearRampToValueAtTime(val, this.engine.renderer.currentTime + endTime);
    }

    cancelScheduledValues(cancelTime: number) {
        this.audioParam.cancelScheduledValues(cancelTime);
        if (this.isRendering) this.rendererParam.cancelScheduledValues(cancelTime);
    }
    cancelAndHoldAtValue(cancelTime: number) {
        this.audioParam.cancelAndHoldAtTime(cancelTime);
        if (this.isRendering) this.rendererParam.cancelAndHoldAtTime(cancelTime);
    }

    get value() {return this.audioParam.value;}
    set value(val: number) {this.audioParam.value = val;}
    get defaultValue() {return this.audioParam.defaultValue;}
}