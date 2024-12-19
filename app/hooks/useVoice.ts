import { useState, useCallback, useRef, useEffect } from 'react';
import { AudioRecorder } from '../utils/AudioRecorder';
import { AudioPlayer } from '../utils/AudioPlayer';
import { Message } from '../types/chat';
import { VoiceModeState } from '../audio/types';

export const useVoice = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioPlayerRef = useRef<AudioPlayer | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isWsConnected, setIsWsConnected] = useState(false);

    const cleanup = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (audioPlayerRef.current) {
            audioPlayerRef.current.stop();
        }
        setTranscription('');
        setIsListening(false);
        setIsWsConnected(false);
    }, []);

    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    const startListening = useCallback(async () => {
        console.log('startListening called');
        setIsListening(true);
        setError(null);
        
        const initializeWebSocket = async () => {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/ws`;
                const ws = new WebSocket(wsUrl);
                
                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    setError('Failed to connect to voice server. Voice features will be disabled.');
                    setIsWsConnected(false);
                    cleanup();
                };

                ws.onclose = () => {
                    setIsWsConnected(false);
                    cleanup();
                };

                return ws;
            } catch (error) {
                console.error('Failed to initialize WebSocket:', error);
                setError('Failed to initialize voice features.');
                setIsWsConnected(false);
                return null;
            }
        };

        try {
            const ws = await initializeWebSocket();
            if (!ws) {
                throw new Error('Failed to initialize WebSocket');
            }

            const AudioContextClass = window.AudioContext;
            const audioContext = new AudioContextClass({ sampleRate: 24000 });
            let buffer = new Uint8Array(0);
            const BUFFER_SIZE = 4800;
            let isResponseActive = false;
            let speechDetected = false;

            const appendToBuffer = (newData: Uint8Array) => {
                const newBuffer = new Uint8Array(buffer.length + newData.length);
                newBuffer.set(buffer);
                newBuffer.set(newData, buffer.length);
                buffer = newBuffer;
            };

            const handleAudioData = (data: ArrayBuffer) => {
                const uint8Array = new Uint8Array(data);
                appendToBuffer(uint8Array);

                if (buffer.length >= BUFFER_SIZE) {
                    const toSend = buffer.slice(0, BUFFER_SIZE);
                    buffer = buffer.slice(BUFFER_SIZE);

                    const regularArray = Array.from(toSend)
                        .map(b => String.fromCharCode(b))
                        .join('');
                    const base64 = btoa(regularArray);

                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'input_audio_buffer.append',
                            audio: base64
                        }));
                    }
                }
            };

            ws.onopen = async () => {
                console.log('WebSocket connection established');
                setIsWsConnected(true);
                
                ws.send(JSON.stringify({
                    type: 'session.update',
                    session: {
                        modalities: ["text", "audio"],
                        instructions: "You are a helpful assistant.",
                        voice: "alloy",
                        input_audio_transcription: {
                            enabled: true,
                            model: "whisper-1"
                        },
                        turn_detection: {
                            type: "server_vad",
                            threshold: 0.5,
                            prefix_padding_ms: 300,
                            silence_duration_ms: 200
                        }
                    }
                }));

                try {
                    await audioContext.audioWorklet.addModule('/audio-playback-worklet.js');
                    const audioPlayer = new AudioPlayer(audioContext);
                    await audioPlayer.init();
                    audioPlayerRef.current = audioPlayer;
                    
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        audio: {
                            sampleRate: 24000,
                            channelCount: 1,
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        } 
                    });
                    const audioRecorder = new AudioRecorder(handleAudioData);
                    await audioRecorder.start(stream);
                    
                    wsRef.current = ws;
                    audioContextRef.current = audioContext;
                } catch (error) {
                    console.error('Error initializing audio:', error);
                    setError('Failed to initialize audio. Please check your microphone permissions.');
                    cleanup();
                }

                ws.onmessage = event => {
                    const data = JSON.parse(event.data);
                    console.log('Received message type:', data.type);
                    
                    switch(data.type) {
                        case 'input_audio_buffer.speech_started':
                            console.log('Speech detected');
                            speechDetected = true;
                            break;
                        case 'input_audio_buffer.speech_stopped':
                            console.log('Speech stopped');
                            if (speechDetected && !isResponseActive) {
                                ws.send(JSON.stringify({
                                    type: 'response.create',
                                    response: {
                                        modalities: ["text", "audio"]
                                    }
                                }));
                                isResponseActive = true;
                            }
                            break;
                        case 'response.audio.delta':
                            const binary = atob(data.delta);
                            const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
                            const pcmData = new Int16Array(bytes.buffer);
                            audioPlayerRef.current?.play(pcmData);
                            break;
                        case 'response.done':
                            console.log('Response completed');
                            isResponseActive = false;
                            speechDetected = false;
                            break;
                        case 'error':
                            console.error('OpenAI error:', data.error);
                            break;
                        case 'response.audio_transcript.done':
                            console.log('model:', data.transcript);
                            setMessages(prev => [...prev, {
                                role: 'assistant',
                                content: data.transcript
                            }]);
                            break;
                        case 'conversation.item.input_audio_transcription.completed':
                            console.log('user:', data.transcript);
                            setMessages(prev => [...prev, {
                                role: 'user',
                                content: data.transcript
                            }]);
                            setTranscription('');
                            break;
                    }
                };
            };

        } catch (error) {
            console.error('Error in startListening:', error);
            setError('Failed to start voice recording. Please try again.');
            setIsListening(false);
            cleanup();
        }
    }, [cleanup]);

    const stopListening = useCallback(() => {
        console.log('stopListening called');
        setIsListening(false);
        
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (audioPlayerRef.current) {
            audioPlayerRef.current.stop();
        }

        setTranscription('');
    }, []);

    return {
        isListening,
        transcription,
        messages,
        startListening,
        stopListening,
        error,
        isWsConnected
    };
}; 