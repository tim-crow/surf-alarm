'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMode = searchParams.get('mode') === 'login' ? 'login' : 'signup';

  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      if (error.message.includes('already registered')) {
        setError('An account with this email already exists. Try logging in instead.');
      } else {
        setError(error.message);
      }
    } else {
      router.push('/setup');
    }
    setLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError('Invalid email or password');
    } else {
      router.push('/account');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="weather-lines"></div>
        <div className="weather-lines-2"></div>
        <div className="weather-curves"></div>
      </div>

      <div className="glass w-full max-w-md p-8 z-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-1">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              SwellCheck
            </span>
          </h1>
        </div>

        {mode === 'signup' ? (
          <>
            <h2 className="text-2xl font-semibold text-white text-center mb-1">
              Get started — it&apos;s free
            </h2>
            <p className="text-white/60 text-center text-sm mb-6">
              Start your 30-day free trial. No charge today.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-white text-center mb-1">
              Welcome back
            </h2>
            <p className="text-white/60 text-center text-sm mb-6">
              Log in to your account
            </p>
          </>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={mode === 'signup' ? handleGoogleSignup : handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/20"></div>
          <span className="text-white/40 text-sm">or</span>
          <div className="flex-1 h-px bg-white/20"></div>
        </div>

        <form onSubmit={mode === 'signup' ? handleEmailSignup : handleEmailLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="glass-input w-full px-4 py-3"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Create a password' : 'Password'}
            className="glass-input w-full px-4 py-3"
            minLength={6}
            required
          />
          <button
            type="submit"
            className="glass-button w-full py-3 disabled:opacity-50"
            disabled={loading}
          >
            {loading
              ? mode === 'signup'
                ? 'Creating account...'
                : 'Logging in...'
              : mode === 'signup'
              ? 'Continue'
              : 'Log In'}
          </button>
        </form>

        {mode === 'signup' && (
          <p className="text-white/40 text-xs text-center mt-4">
            By proceeding, you agree to the{' '}
            <span className="text-white/70 underline cursor-pointer">Terms of Service</span>{' '}
            and{' '}
            <span className="text-white/70 underline cursor-pointer">Privacy Policy</span>
          </p>
        )}

        <p className="text-white/60 text-sm text-center mt-6">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => { setMode('signup'); setError(''); }}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-white">Loading...</p></div>}>
      <AuthForm />
    </Suspense>
  );
}
