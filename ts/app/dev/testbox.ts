import { MusicGenerator } from "../../ai/musicgenerator.js";
import AudioMap from "../../audiomap/audiomap.js";
import { ByteStream } from "../../fileformat/filestream.js";
import { Resources } from "../../mixerycore/resources.js";
import { MixeryConfigurations } from "../config.js";

/**
 * The file where I put all the codes that's related to testing only.
 */
export async function testbox() {}

function info(...obj) {
    console.log("[testbox/info] ", ...obj);
}