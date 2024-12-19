export interface Message {
    role: 'user' | 'assistant';
    content: string;
    image?: {
        url: string;
        fileName: string;
    };
}

export interface ChatState {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
}

export interface ChatProps {
    chatWidth: number;
    setChatWidth: (width: number) => void;
    selectedSheet: string | null;
    messages: Message[];
    setMessages: (messages: Message[]) => void;
    inputMessage: string;
    setInputMessage: (message: string) => void;
    handleSendMessage: () => void;
    handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    toggleChat: () => void;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    isSending: boolean;
    isMessageReady: () => boolean;
    startListening: () => void;
    stopListening: () => void;
    isListening: boolean;
    transcription: string;
    handleMicrophoneClick: () => void;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    audioUrl?: string;
    timestamp: number;
} 