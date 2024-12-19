import { useState, useCallback } from 'react';
import { Message } from '../types/chat';

interface UseChatProps {
    selectedSheet: string | null;
    selectedModel: string;
}

export const useChat = ({ selectedSheet, selectedModel }: UseChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const isMessageReady = useCallback(() => {
        return inputMessage.trim().length > 0 && !isSending;
    }, [inputMessage, isSending]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isSending) return;

        setIsSending(true);
        const currentMessage = inputMessage.trim();
        setMessages(prev => [...prev, { role: 'user', content: currentMessage }]);
        setInputMessage('');

        try {
            const accessToken = localStorage.getItem('userAccessToken');
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: currentMessage,
                    sheetId: selectedSheet,
                    accessToken,
                    model: selectedModel,
                }),
            });

            if (!response.ok) throw new Error('Failed to get AI response');

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error('Error getting AI response:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Sorry, I encountered an error. Please try again.' 
            }]);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleVoiceMessage = useCallback((transcript: string, role: 'user' | 'assistant') => {
        setMessages(prev => [...prev, { 
            role, 
            content: transcript,
            timestamp: Date.now(),
            id: crypto.randomUUID()
        }]);
    }, []);

    return {
        messages,
        setMessages,
        inputMessage,
        setInputMessage,
        isSending,
        isMessageReady,
        handleSendMessage,
        handleKeyPress,
        handleVoiceMessage
    };
}; 