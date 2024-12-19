'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MountainIcon, ChromeIcon } from '@/components/Icons';

export default function LandingPage() {
    const router = useRouter();
    const { login, isLoading, error } = useAuth();

    const handleLogin = async () => {
        try {
            await login();
            router.push('/workspace');
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return (
        <div className="flex flex-col min-h-[100dvh]">
            <header className="px-4 lg:px-6 h-14 flex items-center">
                <Link href="#" className="flex items-center justify-center">
                    <MountainIcon className="h-6 w-6" />
                    <span className="sr-only">Sheet Copilot</span>
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
                        Features
                    </Link>
                    <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
                        Pricing
                    </Link>
                    <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
                        About
                    </Link>
                    <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
                        Contact
                    </Link>
                </nav>
            </header>

            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                                    Your AI-Powered Google Sheets Assistant
                                </h1>
                                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                                    Interact with your spreadsheets using natural language. Get insights, analyze data, and make updates with voice commands.
                                </p>
                            </div>
                            <div className="space-x-4">
                                <Button
                                    onClick={handleLogin}
                                    disabled={isLoading}
                                    className="inline-flex items-center justify-center"
                                >
                                    <ChromeIcon className="mr-2 h-5 w-5" />
                                    {isLoading ? 'Connecting...' : 'Login with Google'}
                                </Button>
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm">{error}</p>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-gray-200">
                <div className="container px-4 py-6 md:px-6">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <p className="text-sm text-gray-500">© 2024 Sheet Copilot. All rights reserved.</p>
                        <nav className="flex gap-4">
                            <Link href="#" className="text-sm text-gray-500 hover:underline">
                                Terms
                            </Link>
                            <Link href="#" className="text-sm text-gray-500 hover:underline">
                                Privacy
                            </Link>
                        </nav>
                    </div>
                </div>
            </footer>
        </div>
    );
} 