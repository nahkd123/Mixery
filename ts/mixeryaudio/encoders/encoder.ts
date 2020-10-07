export default abstract class AudioEncoder {
    abstract async encode(buffer: AudioBuffer): Promise<Blob>;
}