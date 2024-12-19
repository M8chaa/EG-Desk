import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EG-DESK - AI-Powered Google Sheets Assistant",
  description: "Interact with your Google Sheets using natural language and voice commands. Get insights, analyze data, and make updates effortlessly.",
  keywords: ["Google Sheets", "AI", "Voice Control", "Data Analysis", "Productivity"],
  authors: [{ name: "EG-DESK Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} min-h-screen bg-background`}>
        {children}
      </body>
    </html>
  );
}
