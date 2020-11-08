export default class MixerTrack {
    constructor(mixer, name = "Track " + mixer.tracks.length) {
        this.color = ["#ccbbef", "black"];
        this.effects = [];
        this.mixer = mixer;
        this.engine = mixer.engine;
        this.name = name;
        this.output = this.engine.createGain();
        this.input = this.engine.createGain();
        this.input.connect(this.output);
    }
    get gain() { return this.output.gain; }
    add(effect) {
        this.effects.push(effect);
        this.reconnectEffects();
    }
    reconnectEffects() {
        this.effects.forEach(effect => {
            effect.output.disconnect();
        });
        this.input.disconnect(this.output);
        let currentInput = this.output;
        this.effects.forEach(effect => {
            effect.output.connect(currentInput);
            currentInput = effect.input;
        });
        this.input.connect(currentInput);
    }
}