import AudioMap from "../../audiomap/audiomap.js";
import { MixeryConfigurations } from "../config.js";

/**
 * The file where I put all the codes that's related to testing only.
 */
export async function testbox() {
    const session = app.session;
    const bundles = app.bundlesManager;
    const ui = app.ui;

    let fetchInfo = await fetch("/assets/bundles/low-budget/Guiano.json");
    let data = await fetchInfo.json();
    let map = new AudioMap(session.audioEngine.audio, data, async (file) => {
        return await (await fetch("/assets/bundles/low-budget/" + file)).arrayBuffer();
    }, () => {if (0) {
        // Play all sounds at once eh?
        const delay = 0.5;
        let i = 0;
        map.mappedBuffers.forEach((buffer, index) => {
            let source = session.audioEngine.audio.createBufferSource();
            source.buffer = buffer;
            source.connect(session.audioEngine.audio.destination);
            source.start(session.audioEngine.liveTime + (delay * i++));
        });
    }});
}

function info(...obj) {
    console.log("[testbox/info] ", ...obj);
}