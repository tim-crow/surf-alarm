'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const beaches = [
  { name: 'Noosa', state: 'QLD', image: '/beaches/noosa.jpg' },
  { name: 'Maroochydore', state: 'QLD', image: '/beaches/maroochydore.jpg' },
  { name: 'Burleigh Heads', state: 'QLD', image: '/beaches/burleigh-heads.jpg' },
  { name: 'Currumbin', state: 'QLD', image: '/beaches/currumbin.jpg' },
  { name: 'Coolangatta', state: 'QLD', image: '/beaches/coolangatta.jpg' },
  { name: 'Byron Bay', state: 'NSW', image: '/beaches/byron-bay.jpeg' },
  { name: 'Coffs Harbour', state: 'NSW', image: '/beaches/coffs-harbour.webp' },
  { name: 'Newcastle', state: 'NSW', image: '/beaches/merewether.jpg' },
  { name: 'Manly', state: 'NSW', image: '/beaches/manly.jpg' },
  { name: 'Bondi Beach', state: 'NSW', image: '/beaches/bondi-beach.jpg' },
  { name: 'Cronulla', state: 'NSW', image: '/beaches/cronulla.png' },
  { name: 'Torquay', state: 'VIC', image: '/beaches/torquay.webp' },
  { name: 'Bells Beach', state: 'VIC', image: '/beaches/bells-beach.avif' },
  { name: '13th Beach', state: 'VIC', image: '/beaches/13th-beach.jpeg' },
  { name: 'Portsea', state: 'VIC', image: '/beaches/portsea.jpg' },
];

const steps = [
  {
    icon: '📍',
    title: 'Pick Your Beach',
    description: 'Choose from 21 monitored locations across Australia',
  },
  {
    icon: '⚙️',
    title: 'Set Your Conditions',
    description: 'Customize swell, tide, and wind preferences',
  },
  {
    icon: '🔔',
    title: 'Get Alerted',
    description: 'Receive notifications when conditions are perfect',
  },
];

const features = [
  {
    icon: '🏖️',
    title: '21 Beaches',
    description: 'Monitored locations across QLD, NSW, VIC, WA, SA',
  },
  {
    icon: '💨',
    title: 'Smart Wind Analysis',
    description: 'Per-beach offshore, cross-shore, and onshore detection',
  },
  {
    icon: '🎛️',
    title: 'Custom Thresholds',
    description: 'Set your own swell, tide, and wind limits',
  },
  {
    icon: '📡',
    title: 'Real-time Data',
    description: 'Live conditions checked every 30 minutes',
  },
];

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowMenu(false);
  };

  const handlePortal = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error('Portal error:', e);
    }
    setShowMenu(false);
  };

  return (
    <main className="min-h-screen">
      {/* Background weather isobar lines */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="weather-lines"></div>
        <div className="weather-lines-2"></div>
        <div className="weather-curves"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 font-bold text-lg">SwellCheck</span>
          </Link>
          
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 glass px-4 py-2 text-sm text-white hover:bg-white/20 transition-all"
                style={{ borderRadius: '9999px' }}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-400 to-teal-400 flex items-center justify-center text-xs font-bold">
                  {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 glass-dark rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Link
                    href="/account"
                    className="block px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handlePortal}
                    className="block w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition-colors"
                  >
                    Manage Subscription
                  </button>
                  <div className="border-t border-white/10" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/10 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/signup?mode=login"
              className="glass px-4 py-2 text-sm text-white hover:bg-white/20 transition-all"
              style={{ borderRadius: '9999px' }}
            >
              Log In
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center z-10 max-w-2xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              Never Miss Perfect Conditions Again
            </span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl mb-8 max-w-lg mx-auto">
            Get live updates on Australia&apos;s best surf locations when conditions line up — without constantly checking reports.
          </p>

          <div className="max-w-md mx-auto mb-4">
            <Link href="/signup" className="glass-button inline-block w-full py-4 text-lg text-center">
              Start Free Trial →
            </Link>
          </div>

          <p className="text-white/40 text-sm">
            Currently in testing — try it for free
          </p>
        </div>
      </section>

      {/* Beach Photos Carousel */}
      <section className="relative z-10 py-20">
        <div className="max-w-5xl mx-auto px-4 mb-12">
          <h2 className="text-3xl font-bold text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              Iconic Australian Breaks
            </span>
          </h2>
          <p className="text-white/50 text-center mt-2">We monitor all of these — and more</p>
        </div>
        <div className="overflow-x-auto scrollbar-hide pb-4">
          <div className="flex gap-4 px-4 w-max">
            {beaches.map((beach) => (
              <div key={beach.name} className="relative rounded-2xl overflow-hidden w-56 md:w-64 aspect-[3/4] flex-shrink-0 group">
                <img
                  src={beach.image}
                  alt={beach.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-semibold text-sm md:text-base">{beach.name}</p>
                  <p className="text-white/50 text-xs">{beach.state}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              How It Works
            </span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="glass p-6 text-center">
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="text-white/40 text-sm font-medium mb-2">Step {i + 1}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mock Email Alert Popup */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              What You&apos;ll Get
            </span>
          </h2>
          <div
            className="glass-dark p-6 md:p-8 transform rotate-1 hover:rotate-0 transition-transform duration-300"
            style={{ boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)' }}
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-white/40 text-xs ml-2">Email Notification</span>
            </div>

            <p className="text-white/50 text-xs mb-1">Subject:</p>
            <p className="text-white font-semibold mb-4">
              🏄 Surf&apos;s On! Burleigh Heads - Good conditions at 06:30
            </p>

            <div className="bg-gradient-to-r from-blue-500/20 to-teal-500/20 p-4 rounded-lg border border-white/10 mb-4">
              <p className="text-teal-400 font-bold text-sm tracking-wide mb-3">
                OUT THERE! SURF CONDITIONS ARE MET!
              </p>

              <div className="text-white/70 text-sm space-y-1">
                <p><span className="text-white/50">Location:</span> Burleigh Heads</p>
                <p><span className="text-white/50">Time:</span> Thursday 13 February 2025 at 06:30</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Swell Height: 1.8m</span>
                <span className="text-green-400">✓</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Tide Height: 0.45m</span>
                <span className="text-green-400">✓</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Wind: 8 km/h SW - Offshore (ideal)</span>
                <span className="text-green-400">✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              Built for Aussie Surfers
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="glass p-6 flex items-start gap-4">
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-white/60 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="glass p-8">
            <h2 className="text-3xl font-bold mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                Simple Pricing
              </span>
            </h2>
            <p className="text-white/50 text-sm mb-6">No hidden fees. No lock-in.</p>

            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$4.99</span>
              <span className="text-white/50 text-lg">/month</span>
              <p className="text-teal-400 text-sm mt-1">30 days free</p>
            </div>

            <ul className="text-white/70 text-sm space-y-2 mb-8">
              <li>✓ Unlimited alerts</li>
              <li>✓ All 21 beaches</li>
              <li>✓ Cancel anytime</li>
            </ul>

            <Link href="/signup" className="glass-button inline-block w-full py-3">
              Start Free Trial →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-8 border-t border-white/10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">© 2025 SwellCheck</p>
          <div className="flex gap-6 text-white/40 text-sm">
            <Link href="/signup" className="hover:text-white/70 transition-colors">Sign Up</Link>
            <Link href="/account" className="hover:text-white/70 transition-colors">Log In</Link>
            <a href="mailto:support@swellcheck.co" className="hover:text-white/70 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
