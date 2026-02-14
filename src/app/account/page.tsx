'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { beaches, beachesByState, stateOrder, stateNames, defaultWindSpeeds, degreeToCompass } from '@/data/beaches';

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sessionEmail, setSessionEmail] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    beachId: '',
    minSwell: 1.0,
    maxSwell: 3.0,
    minTide: 0,
    maxTide: 2.0,
    offshoreMaxWind: defaultWindSpeeds.offshore,
    crossShoreMaxWind: defaultWindSpeeds.crossShore,
    onshoreMaxWind: defaultWindSpeeds.onshore,
    startHour: 5,
    endHour: 18,
  });

  const selectedBeach = beaches.find(b => b.id === Number(formData.beachId));

  useEffect(() => {
    if (selectedBeach) {
      setFormData(prev => ({
        ...prev,
        minTide: selectedBeach.tide.minTide,
        maxTide: selectedBeach.tide.maxTide,
      }));
    }
  }, [selectedBeach?.id]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/signup?mode=login');
        return;
      }

      const email = session.user.email!;
      setSessionEmail(email);

      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (fetchError || !user) {
        router.push('/setup');
        return;
      }

      setFormData({
        name: user.name || '',
        email: user.email || '',
        beachId: user.beach_id ? String(user.beach_id) : '',
        minSwell: user.min_swell ?? 1.0,
        maxSwell: user.max_swell ?? 3.0,
        minTide: user.min_tide ?? 0,
        maxTide: user.max_tide ?? 2.0,
        offshoreMaxWind: user.offshore_max_wind ?? defaultWindSpeeds.offshore,
        crossShoreMaxWind: user.cross_shore_max_wind ?? defaultWindSpeeds.crossShore,
        onshoreMaxWind: user.onshore_max_wind ?? defaultWindSpeeds.onshore,
        startHour: user.start_hour ?? 5,
        endHour: user.end_hour ?? 18,
      });
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (name: string, value: number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
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
        .eq('email', sessionEmail);

      if (updateError) throw updateError;

      setSuccessMessage('Settings updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const formatWindDisplay = (start: number, end: number): string => {
    return `${degreeToCompass(start)}-${degreeToCompass(end)}`;
  };

  if (loading) {
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
      </div>

      <div className="glass w-full max-w-md p-8 z-10">
        <h2 className="text-2xl font-semibold text-white mb-6">Your Settings</h2>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-4">
            <p className="text-green-300 text-sm">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Personal Info */}
          <div className="glass-dark p-4 rounded-lg space-y-4">
            <div>
              <label className="block text-white/80 text-sm mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your name"
                className="glass-input w-full px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-2">Email</label>
              <p className="text-white/60 text-sm px-4 py-3">{formData.email}</p>
              <p className="text-white/40 text-xs mt-1">Contact support to change email</p>
            </div>
          </div>

          {/* Beach Selection */}
          <div className="glass-dark p-4 rounded-lg space-y-4">
            <div>
              <label className="block text-white/80 text-sm mb-2">Your Beach</label>
              <select
                name="beachId"
                value={formData.beachId}
                onChange={handleInputChange}
                className="glass-select w-full px-4 py-3"
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
          </div>

          {/* Conditions */}
          {selectedBeach && (
            <>
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

              {/* Wind by Direction */}
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
            </>
          )}

          {/* Save */}
          <button
            type="submit"
            className="glass-button w-full py-3"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Log Out */}
        <button
          type="button"
          onClick={handleLogout}
          className="glass-input w-full py-3 mt-4 text-center hover:bg-white/10"
        >
          Log Out
        </button>
      </div>

      {/* Back to Home */}
      <Link href="/" className="text-white/50 hover:text-white/80 text-sm mt-6 z-10">
        ← Back to Home
      </Link>
    </main>
  );
}
