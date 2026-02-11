'use client';

import { useState, useEffect } from 'react';
import { beaches, beachesByState, stateOrder, stateNames, defaultWindSpeeds, degreeToCompass, Beach } from '@/data/beaches';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    beachId: '',
    // Swell range
    minSwell: 1.0,
    maxSwell: 3.0,
    // Tide range
    minTide: 0,
    maxTide: 2.0,
    // Wind speeds by type
    offshoreMaxWind: defaultWindSpeeds.offshore,
    crossShoreMaxWind: defaultWindSpeeds.crossShore,
    onshoreMaxWind: defaultWindSpeeds.onshore,
    // Time
    startHour: 5,
    endHour: 18,
  });

  const selectedBeach = beaches.find(b => b.id === Number(formData.beachId));

  // Update tide presets when beach is selected
  useEffect(() => {
    if (selectedBeach) {
      setFormData(prev => ({
        ...prev,
        minTide: selectedBeach.tide.minTide,
        maxTide: selectedBeach.tide.maxTide,
      }));
    }
  }, [selectedBeach?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSliderChange = (name: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Final step - create account and redirect to Stripe
      setLoading(true);
      setError('');
      
      try {
        // Save user to database
        const { data: userData, error: insertError } = await supabase
          .from('users')
          .insert({
            email: formData.email,
            name: formData.name,
            beach_id: Number(formData.beachId),
            beach_name: selectedBeach?.name || '',
            min_swell: formData.minSwell,
            max_swell: formData.maxSwell,
            min_tide: formData.minTide,
            max_tide: formData.maxTide,
            offshore_max_wind: formData.offshoreMaxWind,
            cross_shore_max_wind: formData.crossShoreMaxWind,
            onshore_max_wind: formData.onshoreMaxWind,
            start_hour: formData.startHour,
            end_hour: formData.endHour,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;

        // Create Stripe checkout session
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            userId: userData.id,
          }),
        });

        const checkoutData = await response.json();
        
        if (!response.ok) {
          throw new Error(checkoutData.error || 'Failed to create checkout session');
        }

        // Redirect to Stripe Checkout
        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
        setLoading(false);
      }
    }
  };

  // Format wind direction range for display
  const formatWindDisplay = (start: number, end: number): string => {
    const startCompass = degreeToCompass(start);
    const endCompass = degreeToCompass(end);
    return `${startCompass}-${endCompass}`;
  };

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
        <img 
          src="/logo.png" 
          alt="SwellCheck" 
          className="h-32 mx-auto mb-1"
        />
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
            SwellCheck
          </span>
        </h1>
        <p className="text-white/70 text-lg">
          Get notified when conditions are perfect
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6 z-10">
        {[1, 2, 3].map((s) => (
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

      {/* Success Screen */}
      {success && (
        <div className="glass w-full max-w-md p-8 z-10 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-4">You're all set!</h2>
          <p className="text-white/70 mb-4">
            Check your email to confirm your account.
          </p>
          <p className="text-white/50 text-sm">
            Your 30-day free trial has started. We'll notify you when conditions are perfect at {selectedBeach?.name}.
          </p>
        </div>
      )}

      {/* Glass Card */}
      {!success && (
      <div className="glass w-full max-w-md p-8 z-10">
        <form onSubmit={handleSubmit}>
          {/* Error display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Create your account
              </h2>
              
              <div>
                <label className="block text-white/80 text-sm mb-2">Your Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  className="glass-input w-full px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="glass-input w-full px-4 py-3"
                  required
                />
              </div>

              <div className="pt-4">
                <p className="text-white/60 text-sm text-center mb-4">
                  🎉 Free for 30 days, then $4.99/month
                </p>
                <button type="submit" className="glass-button w-full py-3">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Beach Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Select your beach
              </h2>

              <div>
                <label className="block text-white/80 text-sm mb-2">Choose your local break</label>
                <select
                  name="beachId"
                  value={formData.beachId}
                  onChange={handleInputChange}
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

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="glass-input px-6 py-3 hover:bg-white/10"
                >
                  ← Back
                </button>
                <button type="submit" className="glass-button flex-1 py-3" disabled={!selectedBeach}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Conditions */}
          {step === 3 && selectedBeach && (
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
                    setFormData(prev => ({
                      ...prev,
                      minSwell: 1.0,
                      maxSwell: 3.0,
                      minTide: selectedBeach.tide.minTide,
                      maxTide: selectedBeach.tide.maxTide,
                      offshoreMaxWind: defaultWindSpeeds.offshore,
                      crossShoreMaxWind: defaultWindSpeeds.crossShore,
                      onshoreMaxWind: defaultWindSpeeds.onshore,
                      startHour: 5,
                      endHour: 18,
                    }));
                  }}
                  className="text-xs text-white/50 hover:text-white/80 underline whitespace-nowrap mt-1"
                >
                  Reset to defaults
                </button>
              </div>

              {/* Swell Range */}
              <div className="glass-dark p-4 rounded-lg">
                <div className="flex justify-between text-white/80 text-sm mb-3">
                  <label className="font-medium">Swell Height</label>
                  <span className="text-teal-400">{formData.minSwell}m – {formData.maxSwell}m</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-white/50 text-xs">Min</span>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={formData.minSwell}
                      onChange={(e) => handleSliderChange('minSwell', parseFloat(e.target.value))}
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
                      value={formData.maxSwell}
                      onChange={(e) => handleSliderChange('maxSwell', parseFloat(e.target.value))}
                      className="slider"
                    />
                  </div>
                </div>
              </div>

              {/* Tide Range */}
              <div className="glass-dark p-4 rounded-lg">
                <div className="flex justify-between text-white/80 text-sm mb-1">
                  <label className="font-medium">Tide Height</label>
                  <span className="text-teal-400">{formData.minTide.toFixed(1)}m – {formData.maxTide.toFixed(1)}m</span>
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
                      value={formData.minTide}
                      onChange={(e) => handleSliderChange('minTide', parseFloat(e.target.value))}
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
                      value={formData.maxTide}
                      onChange={(e) => handleSliderChange('maxTide', parseFloat(e.target.value))}
                      className="slider"
                    />
                  </div>
                </div>
              </div>

              {/* Wind by Type */}
              <div className="glass-dark p-4 rounded-lg">
                <label className="block text-white/80 text-sm font-medium mb-4">
                  Maximum Wind Speed by Direction
                </label>

                {/* Offshore / Cross-Offshore */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <div>
                      <span className="text-green-400">● Offshore / Cross-Off <span className="text-white/40">(Ideal)</span></span>
                      <span className="text-white/40 text-xs block">
                        {formatWindDisplay(selectedBeach.wind.offshoreRange[0], selectedBeach.wind.offshoreRange[1])}
                        {' '}({selectedBeach.wind.offshoreRange[0]}°–{selectedBeach.wind.offshoreRange[1]}°)
                      </span>
                    </div>
                    <span className="text-teal-400">{formData.offshoreMaxWind} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="1"
                    value={formData.offshoreMaxWind}
                    onChange={(e) => handleSliderChange('offshoreMaxWind', parseInt(e.target.value))}
                    className="slider"
                  />
                </div>

                {/* Cross-Shore */}
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
                    <span className="text-teal-400">{formData.crossShoreMaxWind} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    value={formData.crossShoreMaxWind}
                    onChange={(e) => handleSliderChange('crossShoreMaxWind', parseInt(e.target.value))}
                    className="slider"
                  />
                </div>

                {/* Onshore */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <div>
                      <span className="text-red-400">● Onshore (Avoid)</span>
                      <span className="text-white/40 text-xs block">
                        {formatWindDisplay(selectedBeach.wind.onshoreRange[0], selectedBeach.wind.onshoreRange[1])}
                        {' '}({selectedBeach.wind.onshoreRange[0]}°–{selectedBeach.wind.onshoreRange[1]}°)
                      </span>
                    </div>
                    <span className="text-teal-400">{formData.onshoreMaxWind} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={formData.onshoreMaxWind}
                    onChange={(e) => handleSliderChange('onshoreMaxWind', parseInt(e.target.value))}
                    className="slider"
                  />
                </div>
              </div>

              {/* Alert Hours */}
              <div className="glass-dark p-4 rounded-lg">
                <div className="flex justify-between text-white/80 text-sm mb-3">
                  <label className="font-medium">Alert Hours</label>
                  <span className="text-teal-400">
                    {formData.startHour}:00 – {formData.endHour}:00
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/50 text-xs">From</label>
                    <select
                      name="startHour"
                      value={formData.startHour}
                      onChange={handleInputChange}
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
                      name="endHour"
                      value={formData.endHour}
                      onChange={handleInputChange}
                      className="glass-select w-full px-3 py-2 text-sm mt-1"
                    >
                      {[16, 17, 18, 19, 20].map(h => (
                        <option key={h} value={h}>{h > 12 ? h - 12 : h}:00 PM</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-500/20 to-teal-500/20 p-4 rounded-lg border border-white/10">
                <p className="text-white/80 text-sm font-medium mb-2">Your Alert Settings:</p>
                <ul className="text-white/60 text-xs space-y-1">
                  <li>📍 {selectedBeach.name}</li>
                  <li>🌊 Swell: {formData.minSwell}m – {formData.maxSwell}m</li>
                  <li>🌊 Tide: {formData.minTide.toFixed(1)}m – {formData.maxTide.toFixed(1)}m</li>
                  <li>💨 Offshore: up to {formData.offshoreMaxWind} km/h</li>
                  <li>💨 Cross-shore: up to {formData.crossShoreMaxWind} km/h</li>
                  <li>💨 Onshore: up to {formData.onshoreMaxWind} km/h</li>
                  <li>⏰ {formData.startHour}:00 AM – {formData.endHour > 12 ? formData.endHour - 12 : formData.endHour}:00 PM</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="glass-input px-6 py-3 hover:bg-white/10"
                >
                  ← Back
                </button>
                <button 
                  type="submit" 
                  className="glass-button flex-1 py-3 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : '🏄 Start Free Trial'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      )}

      {/* Footer */}
      <p className="text-white/40 text-sm mt-8 z-10">
        Free for 30 days • Cancel anytime • $4.99/month after trial
      </p>
    </main>
  );
}
