"use client";
import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent, useCallback } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Resizable } from 're-resizable';

function WorkSpacePage() {
  const [sheetsFiles, setSheetsFiles] = useState<{ id: string; name: string; thumbnailLink: string }[]>([]);
  const [orderBy, setOrderBy] = useState('lastOpened');
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your AI assistant. How can I help you with your spreadsheet today?" },
    { role: 'user', content: "Can you summarize the data in column A for me?" },
    { role: 'assistant', content: "Certainly! I'd be happy to summarize the data in column A for you. However, I'll need you to select a specific spreadsheet first. Once you've chosen a sheet from the list on the left, I can access its contents and provide a summary of column A. Is there a particular spreadsheet you'd like me to analyze?" },
    { role: 'user', content: "Oh, right. I haven't selected a sheet yet. Let me do that now." },
    { role: 'assistant', content: "No problem! Take your time to select the spreadsheet you want to work with. Once you've made your selection, just let me know, and I'll be ready to analyze column A or any other part of the spreadsheet you need help with." },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState('openai');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatWidth, setChatWidth] = useState(400); // Default width
  const [isSending, setIsSending] = useState(false);

  const handleSheetClick = (sheetId: string) => {
    console.log("Sheet selected:", sheetId);
    setSelectedSheet(sheetId);
    setIsExpanded(true);
  };

  const handleCloseSheet = () => {
    setSelectedSheet(null);
    setIsExpanded(false);
  };

  useEffect(() => {
    const fetchSheets = async () => {
      const accessToken = localStorage.getItem('userAccessToken');
      if (!accessToken) {
        console.error("No access token found.");
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken, orderBy }),
        });

        if (!response.ok) throw new Error('Failed to fetch sheets');

        const data = await response.json();
        setSheetsFiles(data);
      } catch (error) {
        console.error('Error fetching sheets:', error);
        router.push('/error');
      }
    };

    fetchSheets();
  }, [router, orderBy]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
  };

  const isMessageReady = useCallback(() => {
    const ready = inputMessage.trim().length > 0 && !isSending;
    console.log("isMessageReady internal state:", { 
      inputMessageLength: inputMessage.trim().length, 
      isSending, 
      ready 
    });
    return ready;
  }, [inputMessage, isSending]);

  useEffect(() => {
    console.log("isMessageReady:", isMessageReady());
  }, [isMessageReady]);

  const handleSendMessage = async () => {
    console.log("handleSendMessage called with:", { inputMessage, selectedSheet, isSending });
    if (!inputMessage.trim() || isSending) {
      console.log("Message not sent. Conditions not met:", { 
        hasInputMessage: !!inputMessage.trim(), 
        isNotSending: !isSending 
      });
      return;
    }

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
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    console.log("Key pressed:", e.key);
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log("Enter key pressed, sending message...");
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    console.log("Chat toggled. Current selectedSheet:", selectedSheet);
  };

  useEffect(() => {
    console.log("selectedSheet updated:", selectedSheet);
  }, [selectedSheet]);

  return (
    <div className="flex flex-col h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <MountainIcon className="h-6 w-6" />
          <span className="sr-only">EG Desk</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Features
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Pricing
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            About
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Contact
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex overflow-hidden">
        <div className={`flex-grow ${isChatOpen ? `lg:w-[calc(100%-${chatWidth}px)]` : ''} bg-muted relative`}>
          {selectedSheet ? (
            <div
              className={`absolute inset-0 bg-white flex flex-col transition-all duration-300 ${
                isExpanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
              }`}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold">Sheet {selectedSheet}</h2>
                <Button variant="outline" size="icon" onClick={handleCloseSheet}>
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 p-4">
                <iframe
                  src={`https://docs.google.com/spreadsheets/d/${selectedSheet}/edit?embedded=true`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                ></iframe>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4">
              <div className="mb-4">
                <label htmlFor="orderBy" className="mr-2">Order by:</label>
                <select
                  id="orderBy"
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value)}
                  className="border rounded p-2"
                >
                  <option value="lastOpened">Last Opened</option>
                  <option value="lastModified">Last Modified</option>
                </select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 auto-rows-max">
                {sheetsFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`google-sheet-card cursor-pointer ${selectedSheet === file.id ? 'border-2 border-blue-500' : ''}`}
                    onClick={() => handleSheetClick(file.id)}
                  >
                    <div className="icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 16 16"
                        fill="green"
                        stroke="white"
                        strokeWidth="0.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-green-500"
                      >
                        <path d="M14.222 0H1.778C.8 0 .008.8.008 1.778L0 4.444v9.778C0 15.2.8 16 1.778 16h12.444C15.2 16 16 15.2 16 14.222V1.778C16 .8 15.2 0 14.222 0zm0 7.111h-7.11v7.111H5.332v-7.11H1.778V5.332h3.555V1.778h1.778v3.555h7.111v1.778z" />
                      </svg>
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <div className="thumbnail">
                      {file.thumbnailLink ? (
                        <img src={file.thumbnailLink} alt={file.name} />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-green-500"
                        >
                          <path d="M14.222 0H1.778C.8 0 .008.8.008 1.778L0 4.444v9.778C0 15.2.8 16 1.778 16h12.444C15.2 16 16 15.2 16 14.222V1.778C16 .8 15.2 0 14.222 0zm0 7.111h-7.11v7.111H5.332v-7.11H1.778V5.332h3.555V1.778h1.778v3.555h7.111v1.778z" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
                      <div className="text-sm">{msg.content}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <div className="flex items-center">
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
        {!isChatOpen && (
          <Button
            className="fixed bottom-20 right-4 z-10"
            onClick={toggleChat}
          >
            Open Chat
          </Button>
        )}
      </main>
      <footer className="h-16 flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <p className="text-xs text-muted-foreground">&copy; 2024 EG Desk. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

function MountainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

function PlaneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 19.5 21 12 2.5 4.5 2 10l15 2-15 2z" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export default WorkSpacePage;
