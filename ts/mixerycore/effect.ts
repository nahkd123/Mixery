import MixerTrackEffect from "../mixeryaudio/mixer/effect.js";
import RenderableGainNode from "../mixeryaudio/nodes/gain.js";
import MoveableWindow from "../windows/window.js";

export abstract class AudioEffect implements MixerTrackEffect {
    abstract name: string;
    abstract author: string[];
    window = new MoveableWindow("name", 0, 0, 300, 250);

    input: RenderableGainNode;
    output: RenderableGainNode;
}