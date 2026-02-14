'use client';

import { Suspense } from 'react';
import Link from 'next/link';

function SuccessContent() {

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background weather isobar lines */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="weather-lines"></div>
        <div className="weather-lines-2"></div>
        <div className="weather-curves"></div>
      </div>

      {/* Logo & Title */}
      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
            SwellCheck
          </span>
        </h1>
      </div>

      <div className="glass w-full max-w-md p-8 z-10 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-4">You're all set!</h2>
        
        <div className="space-y-4 text-white/70">
          <p>
            Your 30-day free trial has started. We'll notify you when conditions are perfect at your beach.
          </p>
          
          <div className="bg-gradient-to-r from-blue-500/20 to-teal-500/20 p-4 rounded-lg border border-white/10">
            <p className="text-sm">
              <span className="text-teal-400 font-medium">What happens next?</span>
            </p>
            <ul className="text-sm text-left mt-2 space-y-1">
              <li>✓ We check conditions every 30 minutes</li>
              <li>✓ You get an email when it's go time</li>
              <li>✓ No charge for 30 days</li>
              <li>✓ Cancel anytime from your email</li>
            </ul>
          </div>

          <p className="text-white/50 text-sm">
            After your trial, you'll be charged $4.99/month to continue receiving alerts.
          </p>
        </div>

        <Link 
          href="/"
          className="glass-button inline-block mt-6 px-6 py-3"
        >
          ← Back to Home
        </Link>
      </div>

      <p className="text-white/40 text-sm mt-8 z-10">
        Questions? Reply to any alert email to reach us.
      </p>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-white">Loading...</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}
