import RenderableGainNode from "../nodes/gain.js";

export default interface MixerTrackEffect {
    // output <- plugin <- input

    /** The audio input to this effect */
    input: RenderableGainNode;

    /** The effect audio output */
    output: RenderableGainNode;
}