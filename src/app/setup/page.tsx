'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { beaches, beachesByState, stateOrder, stateNames, defaultWindSpeeds, degreeToCompass } from '@/data/beaches';
import { supabase } from '@/lib/supabase';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  const [beachId, setBeachId] = useState('');
  const [minSwell, setMinSwell] = useState(1.0);
  const [maxSwell, setMaxSwell] = useState(3.0);
  const [minTide, setMinTide] = useState(0);
  const [maxTide, setMaxTide] = useState(2.0);
  const [offshoreMaxWind, setOffshoreMaxWind] = useState(defaultWindSpeeds.offshore);
  const [crossShoreMaxWind, setCrossShoreMaxWind] = useState(defaultWindSpeeds.crossShore);
  const [onshoreMaxWind, setOnshoreMaxWind] = useState(defaultWindSpeeds.onshore);
  const [startHour, setStartHour] = useState(5);
  const [endHour, setEndHour] = useState(18);

  const selectedBeach = beaches.find(b => b.id === Number(beachId));

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/signup');
      } else {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (selectedBeach) {
      setMinTide(selectedBeach.tide.minTide);
      setMaxTide(selectedBeach.tide.maxTide);
    }
  }, [selectedBeach?.id]);

  const formatWindDisplay = (start: number, end: number): string => {
    const startCompass = degreeToCompass(start);
    const endCompass = degreeToCompass(end);
    return `${startCompass}-${endCompass}`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/signup');
        return;
      }

      const { data: userData, error: insertError } = await supabase
        .from('users')
        .upsert({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
          auth_user_id: session.user.id,
          beach_id: Number(beachId),
          beach_name: selectedBeach?.name || '',
          min_swell: minSwell,
          max_swell: maxSwell,
          min_tide: minTide,
          max_tide: maxTide,
          offshore_max_wind: offshoreMaxWind,
          cross_shore_max_wind: crossShoreMaxWind,
          onshore_max_wind: onshoreMaxWind,
          start_hour: startHour,
          end_hour: endHour,
        }, { onConflict: 'email' })
        .select('id')
        .single();

      if (insertError) throw insertError;

      router.push('/success');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('users_email_key')) {
        setError('An account with this email already exists.');
      } else {
        setError(msg || 'Something went wrong');
      }
      setLoading(false);
    }
  };

  if (!authChecked) {
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="weather-lines"></div>
        <div className="weather-lines-2"></div>
        <div className="weather-curves"></div>
      </div>

      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
            SwellCheck
          </span>
        </h1>
        <p className="text-white/70 text-lg">
          Get notified when conditions are perfect
        </p>
      </div>

      <div className="flex items-center gap-2 mb-6 z-10">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`w-3 h-3 rounded-full transition-all ${
              s === step
                ? 'bg-blue-400 scale-125'
                : s < step
                ? 'bg-teal-400'
                : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      <div className="glass w-full max-w-md p-8 z-10">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Select your beach
            </h2>

            <div>
              <label className="block text-white/80 text-sm mb-2">Choose your local break</label>
              <select
                value={beachId}
                onChange={(e) => setBeachId(e.target.value)}
                className="glass-select w-full px-4 py-3"
                required
              >
                <option value="">Select a beach...</option>
                {stateOrder.map(state => (
                  <optgroup key={state} label={stateNames[state]}>
                    {beachesByState[state]?.map(beach => (
                      <option key={beach.id} value={beach.id}>
                        {beach.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {selectedBeach && (
              <div className="glass-dark p-4">
                <p className="text-teal-400 font-medium text-center">{selectedBeach.name}</p>
                <p className="text-white/60 text-sm text-center">{selectedBeach.region}, {selectedBeach.state}</p>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Ideal Conditions</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-white/50">Offshore:</span>
                      <span className="text-teal-400 ml-1">{selectedBeach.wind.idealLabel}</span>
                    </div>
                    <div>
                      <span className="text-white/50">Best Tide:</span>
                      <span className="text-teal-400 ml-1">{selectedBeach.tide.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="glass-button w-full py-3"
                disabled={!selectedBeach}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 2 && selectedBeach && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Set your conditions
                </h2>
                <p className="text-white/50 text-sm mt-1">
                  Presets are based on local data. Tweak below to fit your preferences.
                </p>
                <p className="text-teal-400/80 text-sm mt-1">{selectedBeach.name}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMinSwell(1.0);
                  setMaxSwell(3.0);
                  setMinTide(selectedBeach.tide.minTide);
                  setMaxTide(selectedBeach.tide.maxTide);
                  setOffshoreMaxWind(defaultWindSpeeds.offshore);
                  setCrossShoreMaxWind(defaultWindSpeeds.crossShore);
                  setOnshoreMaxWind(defaultWindSpeeds.onshore);
                  setStartHour(5);
                  setEndHour(18);
                }}
                className="text-xs text-white/50 hover:text-white/80 underline whitespace-nowrap mt-1"
              >
                Reset to defaults
              </button>
            </div>

            <div className="glass-dark p-4 rounded-lg">
              <div className="flex justify-between text-white/80 text-sm mb-3">
                <label className="font-medium">Swell Height</label>
                <span className="text-teal-400">{minSwell}m – {maxSwell}m</span>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-white/50 text-xs">Min</span>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={minSwell}
                    onChange={(e) => setMinSwell(parseFloat(e.target.value))}
                    className="slider"
                  />
                </div>
                <div>
                  <span className="text-white/50 text-xs">Max</span>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={maxSwell}
                    onChange={(e) => setMaxSwell(parseFloat(e.target.value))}
                    className="slider"
                  />
                </div>
              </div>
            </div>

            <div className="glass-dark p-4 rounded-lg">
              <div className="flex justify-between text-white/80 text-sm mb-1">
                <label className="font-medium">Tide Height</label>
                <span className="text-teal-400">{minTide.toFixed(1)}m – {maxTide.toFixed(1)}m</span>
              </div>
              <p className="text-white/40 text-xs mb-3">Preset: {selectedBeach.tide.label}</p>
              <div className="space-y-3">
                <div>
                  <span className="text-white/50 text-xs">Min</span>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={minTide}
                    onChange={(e) => setMinTide(parseFloat(e.target.value))}
                    className="slider"
                  />
                </div>
                <div>
                  <span className="text-white/50 text-xs">Max</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={maxTide}
                    onChange={(e) => setMaxTide(parseFloat(e.target.value))}
                    className="slider"
                  />
                </div>
              </div>
            </div>

            <div className="glass-dark p-4 rounded-lg">
              <label className="block text-white/80 text-sm font-medium mb-4">
                Maximum Wind Speed by Direction
              </label>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <div>
                    <span className="text-green-400">● Offshore / Cross-Off <span className="text-white/40">(Ideal)</span></span>
                    <span className="text-white/40 text-xs block">
                      {formatWindDisplay(selectedBeach.wind.offshoreRange[0], selectedBeach.wind.offshoreRange[1])}
                      {' '}({selectedBeach.wind.offshoreRange[0]}°–{selectedBeach.wind.offshoreRange[1]}°)
                    </span>
                  </div>
                  <span className="text-teal-400">{offshoreMaxWind} km/h</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={offshoreMaxWind}
                  onChange={(e) => setOffshoreMaxWind(parseInt(e.target.value))}
                  className="slider"
                />
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <div>
                    <span className="text-yellow-400">● Cross-Shore <span className="text-white/40">(Marginal)</span></span>
                    <span className="text-white/40 text-xs block">
                      {selectedBeach.wind.crossShoreRange.map((range, i) => (
                        <span key={i}>
                          {formatWindDisplay(range[0], range[1])}
                          {i < selectedBeach.wind.crossShoreRange.length - 1 && ' / '}
                        </span>
                      ))}
                    </span>
                  </div>
                  <span className="text-teal-400">{crossShoreMaxWind} km/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={crossShoreMaxWind}
                  onChange={(e) => setCrossShoreMaxWind(parseInt(e.target.value))}
                  className="slider"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <div>
                    <span className="text-red-400">● Onshore (Avoid)</span>
                    <span className="text-white/40 text-xs block">
                      {formatWindDisplay(selectedBeach.wind.onshoreRange[0], selectedBeach.wind.onshoreRange[1])}
                      {' '}({selectedBeach.wind.onshoreRange[0]}°–{selectedBeach.wind.onshoreRange[1]}°)
                    </span>
                  </div>
                  <span className="text-teal-400">{onshoreMaxWind} km/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={onshoreMaxWind}
                  onChange={(e) => setOnshoreMaxWind(parseInt(e.target.value))}
                  className="slider"
                />
              </div>
            </div>

            <div className="glass-dark p-4 rounded-lg">
              <div className="flex justify-between text-white/80 text-sm mb-3">
                <label className="font-medium">Alert Hours</label>
                <span className="text-teal-400">
                  {startHour}:00 – {endHour}:00
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs">From</label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="glass-select w-full px-3 py-2 text-sm mt-1"
                  >
                    {[4, 5, 6, 7, 8].map(h => (
                      <option key={h} value={h}>{h}:00 AM</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white/50 text-xs">To</label>
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                    className="glass-select w-full px-3 py-2 text-sm mt-1"
                  >
                    {[16, 17, 18, 19, 20].map(h => (
                      <option key={h} value={h}>{h > 12 ? h - 12 : h}:00 PM</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/20 to-teal-500/20 p-4 rounded-lg border border-white/10">
              <p className="text-white/80 text-sm font-medium mb-2">Your Alert Settings:</p>
              <ul className="text-white/60 text-xs space-y-1">
                <li>📍 {selectedBeach.name}</li>
                <li>🌊 Swell: {minSwell}m – {maxSwell}m</li>
                <li>🌊 Tide: {minTide.toFixed(1)}m – {maxTide.toFixed(1)}m</li>
                <li>💨 Offshore: up to {offshoreMaxWind} km/h</li>
                <li>💨 Cross-shore: up to {crossShoreMaxWind} km/h</li>
                <li>💨 Onshore: up to {onshoreMaxWind} km/h</li>
                <li>⏰ {startHour}:00 AM – {endHour > 12 ? endHour - 12 : endHour}:00 PM</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="glass-input px-6 py-3 hover:bg-white/10"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="glass-button flex-1 py-3 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-white/40 text-sm mt-8 z-10">
        Free for 30 days • Cancel anytime • $4.99/month after trial
      </p>
    </main>
  );
}
