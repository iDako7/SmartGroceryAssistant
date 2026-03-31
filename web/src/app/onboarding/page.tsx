'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { DIETARY_OPTIONS, LANGUAGE_OPTIONS, TASTE_OPTIONS } from '../../lib/profile-options';
import ToggleChip from '../../components/profile/ToggleChip';

type Step = 'welcome' | 'language' | 'dietary' | 'household' | 'taste';

const STEPS: Step[] = ['welcome', 'language', 'dietary', 'household', 'taste'];

export default function OnboardingPage() {
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('welcome');
  const [language, setLanguage] = useState('en');
  const [dietary, setDietary] = useState<string[]>([]);
  const [householdSize, setHouseholdSize] = useState(2);
  const [tastes, setTastes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const stepIndex = STEPS.indexOf(step);
  const isLast = step === 'taste';

  function next() {
    if (!isLast) setStep(STEPS[stepIndex + 1]);
  }

  function back() {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  }

  async function handleFinish() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        language_preference: language,
        dietary_restrictions: dietary,
        household_size: householdSize,
        taste_preferences: tastes.join(', '),
      });
      router.replace('/list');
    } catch {
      setError('Failed to save profile. You can try again or skip for now.');
      setSaving(false);
    }
  }

  function handleSkip() {
    router.replace('/list');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Progress bar */}
        {step !== 'welcome' && (
          <div className="mb-6 flex gap-1.5">
            {STEPS.slice(1).map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < stepIndex ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
                }`}
              />
            ))}
          </div>
        )}

        {/* Welcome */}
        {step === 'welcome' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">🛒</div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Welcome to Smart Grocery
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Let&apos;s set up your profile so we can personalize your grocery experience. This
              takes about 30 seconds.
            </p>
            <div className="mt-4 flex w-full flex-col gap-2">
              <button
                onClick={next}
                className="rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                Get started
              </button>
              <button
                onClick={handleSkip}
                className="rounded-lg py-2.5 text-sm text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Language */}
        {step === 'language' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Preferred language
            </h2>
            <p className="text-sm text-zinc-500">
              We&apos;ll show bilingual names and AI responses in this language.
            </p>
            <div className="flex flex-col gap-2">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLanguage(opt.value)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                    language === opt.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dietary */}
        {step === 'dietary' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Dietary restrictions
            </h2>
            <p className="text-sm text-zinc-500">
              Select any that apply. AI suggestions will respect these.
            </p>
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
            {dietary.length === 0 && (
              <p className="text-xs text-zinc-400">None selected — that&apos;s fine too!</p>
            )}
          </div>
        )}

        {/* Household size */}
        {step === 'household' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Household size
            </h2>
            <p className="text-sm text-zinc-500">Helps AI suggest the right quantities.</p>
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
            </div>
            <p className="text-xs text-zinc-400">
              {householdSize === 1 ? '1 person' : `${householdSize} people`}
            </p>
          </div>
        )}

        {/* Taste preferences */}
        {step === 'taste' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Taste preferences
            </h2>
            <p className="text-sm text-zinc-500">
              What flavors do you enjoy? This helps AI suggest recipes you&apos;ll love.
            </p>
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
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            <p>{error}</p>
            <button onClick={handleSkip} className="mt-1 text-xs underline hover:no-underline">
              Skip and continue to list
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        {step !== 'welcome' && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={back}
              className="text-sm text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              Back
            </button>
            {isLast ? (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Finish'}
              </button>
            ) : (
              <button
                onClick={next}
                className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
