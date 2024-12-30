import { useRef, useEffect, useState } from 'react';
import { Resizable } from 're-resizable';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XIcon, PlaneIcon, ImageIcon, MicrophoneIcon } from "@/components/Icons";
import Image from 'next/image';
import { Message } from '@/app/types/chat';

interface ChatInterfaceProps {
  chatWidth: number;
  setChatWidth: (width: number) => void;
  selectedSheet: string | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  toggleChat: () => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isSending: boolean;
  isMessageReady: () => boolean;
  error?: string | null;
  isWsConnected?: boolean;
  handleMicrophoneClick: () => void;
  isListening: boolean;
  transcription?: string;
}

export default function ChatInterface({
  chatWidth,
  setChatWidth,
  selectedSheet,
  messages,
  setMessages,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  handleKeyPress,
  toggleChat,
  selectedModel,
  setSelectedModel,
  isSending,
  isMessageReady,
  error,
  isWsConnected,
  handleMicrophoneClick,
  isListening,
  transcription,
}: ChatInterfaceProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      addImageMessage(file);
    }
  };

  const addImageMessage = (file: File) => {
    setIsImageUploading(true);
    // Convert the file to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      
      // Add the image message to the chat
      const newMessage: Message = {
        role: 'user',
        content: file.name,
        image: {
          url: base64String,
          fileName: file.name
        }
      };
      setMessages((prev: Message[]) => [...prev, newMessage]);
      
      // Reset input state after image upload
      setInputMessage('');
      setIsImageUploading(false);
    };
    reader.readAsDataURL(file);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      addImageMessage(imageFile);
    }
  };

  return (
    <Resizable
      size={{ width: chatWidth, height: '100%' }}
      onResizeStop={(e, direction, ref, d) => {
        setChatWidth(chatWidth + d.width);
      }}
      minWidth={300}
      maxWidth={800}
      enable={{ left: true }}
    >
      <div 
        className="h-full bg-white border-l flex flex-col relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {error && (
          <div className="p-2 bg-red-100 text-red-800 text-sm">
            {error}
          </div>
        )}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-50/90 border-2 border-dashed border-blue-500 rounded-lg z-50 flex flex-col items-center justify-center">
            <ImageIcon className="h-12 w-12 text-blue-500 mb-2" />
            <div className="text-lg text-blue-700">Drag&Drop files here</div>
            <div className="text-sm text-blue-500 mt-2">or</div>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
          </div>
        )}
        <div className="p-4 flex items-center justify-between border-b">
          <h2 className="text-lg font-bold">Chat</h2>
          <div className="flex items-center">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[120px] mr-2">
                <SelectValue placeholder="Select AI Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={toggleChat}>
              <XIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {!selectedSheet && (
            <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md mb-4">
              No sheet selected. You can still chat, but sheet-specific operations won&apos;t be available.
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg p-3 max-w-[70%] ${
                msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {msg.image ? (
                  <div className="space-y-2">
                    <Image 
                      src={msg.image.url} 
                      alt={msg.image.fileName}
                      width={300}
                      height={200}
                      className="rounded-lg object-cover"
                    />
                    <div className="text-sm text-gray-500">{msg.image.fileName}</div>
                  </div>
                ) : (
                  <div className="text-sm">{msg.content}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <div className="flex flex-col space-y-2">
            {isListening && transcription && (
              <div className="text-sm text-gray-500 italic">
                Transcribing: {transcription}
              </div>
            )}
            <div className="flex items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="icon"
                className="mr-2"
                title="Attach image"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="w-full rounded-md border-muted focus:border-primary focus:ring-primary min-h-[40px] resize-none"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!isMessageReady()}
                variant={isMessageReady() ? "default" : "secondary"}
                className="ml-2"
                title={!selectedSheet ? "Please select a sheet first" : "Send message"}
              >
                {isSending ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <PlaneIcon className="h-5 w-5" />
                )}
              </Button>
              {isWsConnected !== undefined && (
                <Button
                  onClick={handleMicrophoneClick}
                  disabled={!isWsConnected}
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  className="ml-2"
                  title={!isWsConnected ? "Voice features unavailable" : (isListening ? "Stop recording" : "Start recording")}
                >
                  <MicrophoneIcon className={`h-5 w-5 ${isListening ? 'animate-pulse' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Resizable>
  );
} 