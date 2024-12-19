export interface AudioConfig {
    sampleRate: number;
    channels?: number;
}

export interface VoiceState {
    isRecording: boolean;
    isPlaying: boolean;
    error: string | null;
}

export interface AudioData {
    buffer: Int16Array;
    sampleRate: number;
}

export interface AudioProcessorMessage {
    data: {
        buffer: Int16Array;
    };
}

export interface AudioRecorderConfig extends AudioConfig {
    onDataAvailable: (data: ArrayBuffer) => void;
}

export interface AudioPlayerConfig extends AudioConfig {
    onPlaybackComplete?: () => void;
}

export interface VoiceModeState {
    isActive: boolean;
    isProcessing: boolean;
    transcript: string | null;
    audioData: AudioData | null;
    error: string | null;
} 