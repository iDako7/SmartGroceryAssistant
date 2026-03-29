'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { DIETARY_OPTIONS, LANGUAGE_OPTIONS, TASTE_OPTIONS } from '../../lib/profile-options';
import ToggleChip from '../../components/profile/ToggleChip';

export default function ProfilePage() {
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();

  const [language, setLanguage] = useState('en');
  const [dietary, setDietary] = useState<string[]>([]);
  const [householdSize, setHouseholdSize] = useState(2);
  const [tastes, setTastes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  // Populate form from current user profile
  useEffect(() => {
    if (!user) return;
    setLanguage(user.language_preference || 'en');
    setDietary(user.dietary_restrictions || []);
    setHouseholdSize(user.household_size || 2);
    setTastes(user.taste_preferences ? user.taste_preferences.split(', ').filter(Boolean) : []);
  }, [user]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateProfile({
        language_preference: language,
        dietary_restrictions: dietary,
        household_size: householdSize,
        taste_preferences: tastes.join(', '),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/list"
          className="text-sm text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          &larr; Back to list
        </Link>
        <h1 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Profile</h1>
        <div className="w-16" />
      </header>

      <main className="mx-auto w-full max-w-lg space-y-8 p-6">
        {/* Email (read-only) */}
        <section>
          <h2 className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Account
          </h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{user?.email}</p>
        </section>

        {/* Language */}
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Language
          </h2>
          <div className="flex gap-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLanguage(opt.value)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  language === opt.value
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Dietary */}
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Dietary Restrictions
          </h2>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((opt) => (
              <ToggleChip
                key={opt}
                label={opt}
                selected={dietary.includes(opt)}
                onClick={() =>
                  setDietary((prev) =>
                    prev.includes(opt) ? prev.filter((d) => d !== opt) : [...prev, opt]
                  )
                }
              />
            ))}
          </div>
        </section>

        {/* Household */}
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Household Size
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setHouseholdSize((s) => Math.max(1, s - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-lg font-medium text-zinc-600 transition hover:border-emerald-400 dark:border-zinc-600 dark:text-zinc-300"
            >
              -
            </button>
            <span className="min-w-[3rem] text-center text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {householdSize}
            </span>
            <button
              onClick={() => setHouseholdSize((s) => Math.min(20, s + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-lg font-medium text-zinc-600 transition hover:border-emerald-400 dark:border-zinc-600 dark:text-zinc-300"
            >
              +
            </button>
            <span className="text-sm text-zinc-400">
              {householdSize === 1 ? 'person' : 'people'}
            </span>
          </div>
        </section>

        {/* Taste */}
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Taste Preferences
          </h2>
          <div className="flex flex-wrap gap-2">
            {TASTE_OPTIONS.map((opt) => (
              <ToggleChip
                key={opt}
                label={opt}
                selected={tastes.includes(opt)}
                onClick={() =>
                  setTastes((prev) =>
                    prev.includes(opt) ? prev.filter((t) => t !== opt) : [...prev, opt]
                  )
                }
              />
            ))}
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {saved && <span className="text-sm text-emerald-600">Saved!</span>}
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
      </main>
    </div>
  );
}
