'use client';

import { useEffect, useState } from 'react';

export default function TelegramAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check if we're in the Telegram environment
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
    
    // Function to handle the authentication flow
    const authenticate = async () => {
      // If we don't have Telegram WebApp data, we might be testing locally or in a web browser
      // You can decide whether to block access or allow a mock fallback in development
      if (!tg || !tg.initData) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Telegram WebApp not detected. Bypassing check for local development.');
          setIsAuthenticated(true);
          return;
        }
        setError('Please open this application inside the Telegram Bot.');
        return;
      }

      try {
        // 2. Make the POST request to our new Auth Route
        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ initData: tg.initData }),
        });

        if (!response.ok) {
          throw new Error('Failed to validate Telegram session');
        }

        // 3. Handshake successful, cookie is set!
        setIsAuthenticated(true);
      } catch (err: any) {
        console.error('TMA Handshake failed:', err);
        setError('Authentication failed. Please restart the app from Telegram.');
      }
    };

    authenticate();
  }, []);

  // 4. Loading & Error States
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1EB] text-slate-800 p-4 font-sans">
        <div className="text-center p-8 border border-slate-300 rounded shadow-sm bg-white/50 max-w-md">
          <p className="text-xl mb-4">🏮</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1EB] text-slate-800 font-sans">
        <div className="flex flex-col items-center animate-pulse">
          <p className="text-4xl mb-6">⛩️</p>
          <p className="text-lg tracking-widest uppercase font-light text-slate-600">The Dojo is opening...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
