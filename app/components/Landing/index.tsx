import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MountainIcon, ChromeIcon } from '@/components/Icons';

const LandingPage = () => {
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
    <div className="min-h-screen flex flex-col">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link href="#" className="flex items-center justify-center">
          <MountainIcon className="h-6 w-6" />
          <span className="sr-only">EG-DESK</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-6">Welcome to EG-DESK</h1>
        <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl">
          Your AI-powered Google Sheets assistant
        </p>
        <Button
          onClick={handleLogin}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <ChromeIcon className="h-5 w-5" />
          {isLoading ? 'Connecting...' : 'Login with Google'}
        </Button>
        {error && (
          <p className="text-red-500 mt-4">{error}</p>
        )}
      </main>
    </div>
  );
};

export default LandingPage; 