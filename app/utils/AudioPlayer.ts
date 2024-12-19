export class AudioPlayer {
    private playbackNode: AudioWorkletNode | null = null;
    private audioContext: AudioContext;

    constructor(audioContext: AudioContext) {
        this.audioContext = audioContext;
    }

    async init() {
        await this.audioContext.audioWorklet.addModule("/audio-playback-worklet.js");
        this.playbackNode = new AudioWorkletNode(this.audioContext, "audio-playback-worklet");
        this.playbackNode.connect(this.audioContext.destination);
    }

    play(buffer: Int16Array) {
        if (this.playbackNode) {
            this.playbackNode.port.postMessage(buffer);
        }
    }

    stop() {
        if (this.playbackNode) {
            this.playbackNode.port.postMessage(null);
        }
    }
}
