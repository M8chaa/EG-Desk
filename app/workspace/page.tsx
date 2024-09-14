"use client";
import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from 'next/navigation';

function WorkSpacePage() {
  const [sheetsFiles, setSheetsFiles] = useState<{ id: string; name: string; thumbnailLink: string }[]>([]);
  const [orderBy, setOrderBy] = useState('lastOpened');
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const handleSheetClick = (sheetId: string) => {
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

  return (
    <div className="flex flex-col min-h-[100dvh]">
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
      <main className="flex-1 flex">
        <div className="w-full lg:w-3/4 bg-muted relative h-[calc(100vh-3.5rem-4rem)]">
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
                    className="google-sheet-card cursor-pointer"
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
        <div className="w-full lg:w-1/2 bg-white border-l">
          <div className="p-4 h-[calc(100vh_-_56px_-_80px)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Chat</h2>
              <Button variant="outline" size="icon">
                <XIcon className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              <div className="flex items-start justify-end">
                <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                  <div className="font-medium">You</div>
                  <div className="text-muted-foreground text-sm">Hey, can you help me with this sheet?</div>
                </div>
                <Avatar className="ml-2">
                  <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex items-start">
                <Avatar className="mr-2">
                  <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="text-muted-foreground text-sm">Sure, what do you need help with?</div>
              </div>
              <div className="flex items-start justify-end">
                <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                  <div className="font-medium">You</div>
                  <div className="text-muted-foreground text-sm">
                    I&apos;m having trouble with the formulas in this sheet. Can you take a look?
                  </div>
                </div>
                <Avatar className="ml-2">
                  <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex items-start">
                <Avatar className="mr-2">
                  <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="text-muted-foreground text-sm">
                  Sure, let me take a look. Can you share the specific sheet you&apos;re working on?
                </div>
              </div>
              <div className="flex items-start justify-end">
                <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                  <div className="font-medium">You</div>
                  <div className="text-muted-foreground text-sm">
                    It&apos;s the one labeled Sheet 3. I&apos;m having trouble with the SUM formula in cell B12.
                  </div>
                </div>
                <Avatar className="ml-2">
                  <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex items-start">
                <Avatar className="mr-2">
                  <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="text-muted-foreground text-sm">
                  Okay, let me take a look at that. Can you give me a few minutes to review the sheet?
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Textarea
                placeholder="Type your message..."
                className="w-full rounded-md border-muted focus:border-primary focus:ring-primary min-h-[40px] resize-none"
              />
              <Button className="ml-2">
                <PlaneIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
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
