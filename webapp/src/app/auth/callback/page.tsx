'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/setup');
      } else {
        router.push('/signup');
      }
    };
    handleCallback();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="weather-lines"></div>
        <div className="weather-lines-2"></div>
        <div className="weather-curves"></div>
      </div>
      <p className="text-white z-10">Loading...</p>
    </main>
  );
}
