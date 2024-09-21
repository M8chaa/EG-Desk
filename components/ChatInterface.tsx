import React from 'react';
import { Resizable } from 're-resizable';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XIcon, PlaneIcon } from '@/components/Icons';

interface ChatInterfaceProps {
  isChatOpen: boolean;
  chatWidth: number;
  setChatWidth: (width: number) => void;
  selectedSheet: string | null;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  toggleChat: () => void;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  messages: { role: string; content: string }[];
  inputMessage: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSendMessage: () => void;
  isMessageReady: () => boolean;
  isSending: boolean;
  selectedSheetData: any;
  downloadSheetData: (minified: boolean) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isChatOpen,
  chatWidth,
  setChatWidth,
  selectedSheet,
  selectedModel,
  setSelectedModel,
  toggleChat,
  chatContainerRef,
  messages,
  inputMessage,
  handleInputChange,
  handleKeyPress,
  handleSendMessage,
  isMessageReady,
  isSending,
  selectedSheetData,
  downloadSheetData
}) => {
  return (
    <>
      {isChatOpen && (
        <Resizable
          size={{ width: chatWidth, height: '100%' }}
          onResizeStop={(e, direction, ref, d) => {
            setChatWidth(chatWidth + d.width);
          }}
          minWidth={300}
          maxWidth={800}
          enable={{ left: true }}
        >
          <div className="h-full bg-white border-l flex flex-col">
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
              {!selectedSheet ? (
                <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md mb-4">
                  No sheet selected. You can still chat, but sheet-specific operations won&apos;t be available.
                </div>
              ) : selectedSheetData ? (
                <div className="p-4 bg-blue-100 text-blue-800 rounded-md mb-4 flex flex-col space-y-2">
                  <Button 
                    onClick={() => downloadSheetData(true)}
                    className="w-full"
                  >
                    Download Minified Sheet Data
                  </Button>
                  <Button 
                    onClick={() => downloadSheetData(false)}
                    className="w-full"
                  >
                    Download Formatted Sheet Data
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-gray-100 text-gray-800 rounded-md mb-4">
                  Loading sheet data...
                </div>
              )}
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg p-3 max-w-[70%] ${
                    msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <div className="text-sm">{msg.content}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <div className="flex items-center mb-2">
                <Textarea
                  value={inputMessage}
                  onChange={handleInputChange}
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
              </div>
            </div>
          </div>
        </Resizable>
      )}
    </>
  );
};

export default ChatInterface;