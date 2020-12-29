import AudioMap from "../../audiomap/audiomap.js";
import { ByteStream } from "../../fileformat/filestream.js";
import { MixeryConfigurations } from "../config.js";

/**
 * The file where I put all the codes that's related to testing only.
 */
export async function testbox() {
    let net = new convnetjs.Net();
    net.makeLayers([
        {type: "input", out_sx: 1, out_sy: 1, out_depth: 2},
        {type: "fc", num_neurons: 20, activation: "relu"},
        {type: "fc", num_neurons: 20, activation: "relu"},
        {type: "softmax", num_classes: 2}
    ]);

    let vol = new convnetjs.Vol([0.5, -1.3]);
    net.forward(vol);
    console.log(vol.w[0]);
}

function info(...obj) {
    console.log("[testbox/info] ", ...obj);
}