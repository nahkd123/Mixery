import AudioMap from "../../audiomap/audiomap.js";
import { ByteStream } from "../../fileformat/filestream.js";
import { MixeryConfigurations } from "../config.js";

/**
 * The file where I put all the codes that's related to testing only.
 */
export async function testbox() {
    let a = new ByteStream.WriteableStream();
    a.writeUint32(12345);
    a.writeVarInt(69420);
    let b = await a.convertToReadableStream();
    console.log(b);
    console.log(b.readUint32());
    console.log(b.readVarInt());
}

function info(...obj) {
    console.log("[testbox/info] ", ...obj);
}