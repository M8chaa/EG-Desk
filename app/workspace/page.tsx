"use client";
import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent, useCallback } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Resizable } from 're-resizable';
import SheetList from "@/components/SheetList";
import SheetViewer from "@/components/SheetViewer";
import ChatInterface from "@/components/ChatInterface";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
  const [selectedSheetData, setSelectedSheetData] = useState<any>(null);
  const [currentSheetTab, setCurrentSheetTab] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
      router.push('/error');
    }
  }, [router, orderBy]);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  const fetchSheetData = useCallback(async (sheetId: string) => {
    const accessToken = localStorage.getItem('userAccessToken');
    if (!accessToken) {
      console.error("No access token found.");
      return;
    }

    try {
      const response = await fetch('/api/sheetData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, sheetId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to fetch sheet data: ${data.error}`);
      }

      setSelectedSheetData(data);
    } catch (error) {
      console.error('Error fetching sheet data:', error);
    }
  }, []);

  const handleSheetClick = useCallback((sheetId: string) => {
    setSelectedSheet(sheetId);
    setIsExpanded(true);
    fetchSheetData(sheetId);
  }, [fetchSheetData]);

  const handleCloseSheet = () => {
    setSelectedSheet(null);
    setIsExpanded(false);
  };

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

  const handleSendMessage = useCallback(async () => {
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
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsSending(false);
    }
  }, [inputMessage, isSending, selectedSheet, selectedModel]);

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

  useEffect(() => {
    console.log("selectedSheet updated:", selectedSheet);
  }, [selectedSheet]);

  const downloadSheetData = () => {
    if (selectedSheetData) {
      try {
        const dataStr = JSON.stringify(selectedSheetData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        // Get the spreadsheet title or use a default name
        const spreadsheetTitle = selectedSheetData.spreadsheetTitle || 'unknown_spreadsheet';
        
        // Create a more descriptive filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeTitle = spreadsheetTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const exportFileDefaultName = `spreadsheet_${safeTitle}_${timestamp}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      } catch (error) {
        console.error('Error preparing sheet data for download:', error);
        // Optionally, you could show an error message to the user here
      }
    }
  };

  const handleIframeLoad = () => {
    if (iframeRef.current) {
      const url = new URL(iframeRef.current.src);
      const gid = url.searchParams.get('gid');
      console.log(`Iframe loaded. Current URL: ${url.toString()}`);
      console.log(`Current gid: ${gid}, Previous gid: ${currentSheetTab}`);
      if (gid !== currentSheetTab) {
        setCurrentSheetTab(gid);
        const logMessage = `Sheet tab changed to gid: ${gid}`;
        console.log(logMessage);
        setMessages(prev => [...prev, { role: 'system', content: logMessage }]);
      } else {
        console.log('No change in gid detected');
      }
    } else {
      console.log('iframeRef.current is null');
    }
  };

  useEffect(() => {
    if (selectedSheet) {
      const baseUrl = `https://docs.google.com/spreadsheets/d/${selectedSheet}/edit`;
      const url = new URL(baseUrl);
      url.searchParams.set('embedded', 'true');
      if (currentSheetTab) {
        url.searchParams.set('gid', currentSheetTab);
      }
      if (iframeRef.current) {
        console.log(`Updating iframe src to: ${url.toString()}`);
        iframeRef.current.src = url.toString();
      } else {
        console.log('iframeRef.current is null when trying to update src');
      }
    }
  }, [selectedSheet, currentSheetTab]);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        <div className={`flex-grow ${isChatOpen ? `lg:w-[calc(100%-${chatWidth}px)]` : ''} bg-muted relative`}>
          {selectedSheet ? (
            <SheetViewer
              selectedSheet={selectedSheet}
              isExpanded={isExpanded}
              handleCloseSheet={handleCloseSheet}
              iframeRef={iframeRef}
              handleIframeLoad={handleIframeLoad}
            />
          ) : (
            <SheetList
              orderBy={orderBy}
              setOrderBy={setOrderBy}
              sheetsFiles={sheetsFiles}
              selectedSheet={selectedSheet}
              handleSheetClick={handleSheetClick}
            />
          )}
        </div>
        <ChatInterface
          isChatOpen={isChatOpen}
          chatWidth={chatWidth}
          setChatWidth={setChatWidth}
          selectedSheet={selectedSheet}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          toggleChat={toggleChat}
          chatContainerRef={chatContainerRef}
          messages={messages}
          inputMessage={inputMessage}
          handleInputChange={handleInputChange}
          handleKeyPress={handleKeyPress}
          handleSendMessage={handleSendMessage}
          isMessageReady={isMessageReady}
          isSending={isSending}
          selectedSheetData={selectedSheetData}
          downloadSheetData={downloadSheetData}
        />
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
