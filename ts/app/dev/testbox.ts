import { MusicGenerator } from "../../ai/musicgenerator.js";
import AudioMap from "../../audiomap/audiomap.js";
import { ByteStream } from "../../fileformat/filestream.js";
import { Resources } from "../../mixerycore/resources.js";
import { MixeryConfigurations } from "../config.js";

/**
 * The file where I put all the codes that's related to testing only.
 */
export async function testbox() {
    let data: MusicGenerator.TrainingData = {
        notes: [
            {index: 0, offset: 0.00, velocity: 1},
            {index: 1, offset: 0.10, velocity: 1},
            {index: 2, offset: 0.20, velocity: 1},
            {index: 3, offset: 0.30, velocity: 1},
            {index: 4, offset: 0.40, velocity: 1},
            {index: 5, offset: 0.50, velocity: 1}
        ]
    };
    let nn = new MusicGenerator.Generator({
        beatsLength: 1,
        notesCount: 12
    });
    nn.addData(data);
    await nn.train({
        epochs: 10000,
        batchSize: 12
    });

    globalThis.abc = (confidence) => {
        const res = <Resources.MIDIResource> app.session.resources.selectedResource;
        nn.forwardToResource(res, {
            confidence
        });
    };
}

function info(...obj) {
    console.log("[testbox/info] ", ...obj);
}