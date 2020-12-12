export default abstract class AudioEncoder {
    abstract encode(buffer: AudioBuffer): Promise<Blob>;
}