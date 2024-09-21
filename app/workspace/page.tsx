"use client";
import { useState, useEffect, useRef, useCallback, ChangeEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SheetList from '@/components/SheetList';
import ChatInterface from '@/components/ChatInterface';
import SheetViewer from '@/components/SheetViewer';
import { Button } from "@/components/ui/button";

function WorkSpacePage() {
  const [sheetsFiles, setSheetsFiles] = useState<{ id: string; name: string; thumbnailLink: string }[]>([]);
  const [orderBy, setOrderBy] = useState('lastOpened');
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
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
      <Header />
      <main className="flex-1 flex overflow-hidden">
        <div className={`flex-grow ${isChatOpen ? `lg:w-[calc(100%-${chatWidth}px)]` : ''} bg-muted relative`}>
          {selectedSheet ? (
            <SheetViewer 
              sheetId={selectedSheet} 
              isExpanded={isExpanded}
              onClose={handleCloseSheet}
            />
          ) : (
            <SheetList 
              sheetsFiles={sheetsFiles} 
              orderBy={orderBy} 
              setOrderBy={setOrderBy}
              onSheetClick={handleSheetClick}
              selectedSheet={selectedSheet}
            />
          )}
        </div>
        {isChatOpen && (
          <ChatInterface 
            chatWidth={chatWidth}
            setChatWidth={setChatWidth}
            selectedSheet={selectedSheet}
            messages={messages}
            setMessages={setMessages}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            handleSendMessage={handleSendMessage}
            handleKeyPress={handleKeyPress}
            toggleChat={toggleChat}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            isSending={isSending}
            isMessageReady={isMessageReady}
          />
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
      <Footer />
    </div>
  );
}

export default WorkSpacePage;
