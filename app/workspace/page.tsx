"use client";
import { useState, useEffect, useRef, useCallback, ChangeEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Layout/Header';
import Footer from '@/app/components/Layout/Footer';
import SheetList from '@/app/components/Sheet/SheetList';
import ChatInterface from '@/app/components/Chat/ChatInterface';
import SheetViewer from '@/app/components/Sheet/SheetViewer';
import { Button } from "@/components/ui/button";

function WorkSpacePage() {
  const [sheetsFiles, setSheetsFiles] = useState<{ id: string; name: string; thumbnailLink: string }[]>([]);
  const [orderBy, setOrderBy] = useState('lastOpened');
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState('openai');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatWidth, setChatWidth] = useState(400); // Default width
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');

  const handleSheetClick = (sheetId: string) => {
    console.log("Sheet selected:", sheetId);
    setSelectedSheet(sheetId);
    setIsExpanded(true);
  };

  const handleCloseSheet = () => {
    setSelectedSheet(null);
    setIsExpanded(false);
  };

  const fetchSheets = useCallback(async () => {
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
      setError('Failed to fetch sheets');
    } finally {
      setIsLoading(false);
    }
  }, [orderBy, router]);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

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

  const handleSendMessage = async () => {
    console.log("handleSendMessage called with:", { inputMessage, selectedSheet, isSending });
    if ((!inputMessage.trim() && !messages[messages.length - 1]?.image) || isSending) {
      console.log("Message not sent. Conditions not met:", { 
        hasInputMessage: !!inputMessage.trim(), 
        hasImage: !!messages[messages.length - 1]?.image,
        isNotSending: !isSending 
      });
      return;
    }

    setIsSending(true);
    const currentMessage = inputMessage.trim();
    const lastMessage = messages[messages.length - 1];
    const hasImage = lastMessage?.image && lastMessage.role === 'user';

    // If there's no image, add a new message. If there is an image, update its content
    if (!hasImage) {
      setMessages(prev => [...prev, { role: 'user', content: currentMessage }]);
    } else {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content: currentMessage || "What do you see in this image?"
        };
        return newMessages;
      });
    }
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
          image: hasImage ? lastMessage.image : undefined
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

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    console.log("Chat toggled. Current selectedSheet:", selectedSheet);
  };

  const handleMicrophoneClick = () => {
    setIsListening(!isListening);
  };

  const handleCreateSheet = async () => {
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
        body: JSON.stringify({ 
          accessToken, 
          action: 'create',
          title: 'New Spreadsheet' 
        }),
      });

      if (!response.ok) throw new Error('Failed to create sheet');

      const data = await response.json();
      console.log('Sheet creation response:', data);
      
      // Refresh the sheet list
      await fetchSheets();
      
      // Select the newly created sheet
      if (data.result?.sheetInfo?.id) {
        handleSheetClick(data.result.sheetInfo.id);
      } else {
        console.error('No sheet ID in response:', data);
        setError('Created sheet but failed to get its ID');
      }
    } catch (error) {
      console.error('Error creating sheet:', error);
      setError('Failed to create new sheet');
    }
  };

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
              isLoading={isLoading}
              error={error}
              onCreateSheet={handleCreateSheet}
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
            startListening={() => setIsListening(true)}
            stopListening={() => setIsListening(false)}
            isListening={isListening}
            transcription={transcription}
            handleMicrophoneClick={handleMicrophoneClick}
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

