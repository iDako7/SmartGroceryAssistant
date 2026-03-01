'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ai } from '../../lib/api';
import type { Item, Section } from '../../types';

interface Props {
  sections: Section[];
  items: Record<string, Item[]>;
  selectedItem: Item | null;
}

type Tab = 'info' | 'translate' | 'alternatives' | 'suggest' | 'inspire';

export default function AiPanel({ sections, items, selectedItem }: Props) {
  const [tab, setTab] = useState<Tab>('info');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('');
  const [targetLang, setTargetLang] = useState('Chinese');
  const [altReason, setAltReason] = useState('');
  const [preferences, setPreferences] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build sections map for suggest/inspire
  const sectionsMap: Record<string, string[]> = {};
  for (const s of sections) {
    sectionsMap[s.name] = (items[s.id] ?? []).map((i) => i.name_en);
  }

  const clearPoll = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };

  useEffect(() => () => clearPoll(), []);

  const startPoll = useCallback((id: string) => {
    clearPoll();
    setJobStatus('pending');
    pollRef.current = setInterval(async () => {
      try {
        const res = await ai.pollJob(id);
        setJobStatus(res.status);
        if (res.status === 'done') {
          setResult(res.result);
          clearPoll();
          setLoading(false);
        }
      } catch {
        clearPoll();
        setLoading(false);
      }
    }, 2000);
  }, []);

  async function run() {
    if (!selectedItem && (tab === 'info' || tab === 'translate' || tab === 'alternatives')) return;
    setLoading(true);
    setResult(null);
    setJobId(null);
    clearPoll();
    try {
      if (tab === 'info') {
        setResult(await ai.itemInfo(selectedItem!.name_en));
      } else if (tab === 'translate') {
        setResult(await ai.translate(selectedItem!.name_en, targetLang));
      } else if (tab === 'alternatives') {
        setResult(await ai.alternatives(selectedItem!.name_en, altReason));
      } else if (tab === 'suggest') {
        const { job_id } = await ai.suggest(sectionsMap);
        setJobId(job_id);
        startPoll(job_id);
        return;
      } else if (tab === 'inspire') {
        const { job_id } = await ai.inspire(sectionsMap, preferences);
        setJobId(job_id);
        startPoll(job_id);
        return;
      }
    } catch (err) {
      setResult({ error: (err as Error).message });
    } finally {
      if (tab !== 'suggest' && tab !== 'inspire') setLoading(false);
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'info', label: 'Info' },
    { id: 'translate', label: 'Translate' },
    { id: 'alternatives', label: 'Alternatives' },
    { id: 'suggest', label: 'Suggest' },
    { id: 'inspire', label: 'Inspire' },
  ];

  const needsItem = tab === 'info' || tab === 'translate' || tab === 'alternatives';

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">✨ AI Assistant</p>
        {selectedItem && (
          <p className="mt-0.5 truncate text-xs text-zinc-400">
            Selected: <span className="font-medium text-emerald-600">{selectedItem.name_en}</span>
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setResult(null);
            }}
            className={`shrink-0 rounded-md px-3 py-1 text-xs font-medium transition ${
              tab === t.id
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 px-4 py-3">
        {needsItem && !selectedItem && (
          <p className="text-xs text-zinc-400">Click an item in your list to select it.</p>
        )}

        {tab === 'translate' && (
          <input
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            placeholder="Target language"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        )}

        {tab === 'alternatives' && (
          <input
            value={altReason}
            onChange={(e) => setAltReason(e.target.value)}
            placeholder="Reason (e.g. dairy free)"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        )}

        {tab === 'inspire' && (
          <input
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="Dietary preferences (optional)"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        )}

        <button
          onClick={run}
          disabled={loading || (needsItem && !selectedItem)}
          className="rounded-lg bg-emerald-600 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-40"
        >
          {loading ? (jobId ? `Waiting… (${jobStatus})` : 'Loading…') : 'Run'}
        </button>
      </div>

      {/* Result */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {result != null && <ResultView data={result} tab={tab} />}
      </div>
    </div>
  );
}

function ResultView({ data, tab }: { data: unknown; tab: Tab }) {
  const d = data as Record<string, unknown>;

  if (d.error) {
    return <p className="text-sm text-red-500">{String(d.error)}</p>;
  }

  if (tab === 'info') {
    return (
      <dl className="space-y-2 text-sm">
        {(['category', 'typical_unit', 'storage_tip', 'nutrition_note'] as const).map((k) => (
          <div key={k}>
            <dt className="font-medium text-zinc-500 capitalize">{k.replace('_', ' ')}</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">{String(d[k] ?? '—')}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if (tab === 'translate') {
    return (
      <div className="space-y-1 text-sm">
        <p className="text-xl font-semibold text-emerald-600">{String(d.name_translated)}</p>
        {Boolean(d.notes) && <p className="text-zinc-500">{String(d.notes)}</p>}
      </div>
    );
  }

  if (tab === 'alternatives') {
    const alts = (d.alternatives as { name: string; reason: string }[]) ?? [];
    return (
      <ul className="space-y-2">
        {alts.map((a, i) => (
          <li key={i} className="rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800">
            <span className="font-medium text-zinc-800 dark:text-zinc-100">{a.name}</span>
            <span className="ml-2 text-zinc-400">{a.reason}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (tab === 'suggest') {
    const suggestions =
      (d.suggestions as { name_en: string; category: string; reason: string }[]) ?? [];
    return (
      <ul className="space-y-2">
        {suggestions.map((s, i) => (
          <li key={i} className="rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800">
            <span className="font-medium text-zinc-800 dark:text-zinc-100">{s.name_en}</span>
            <span className="ml-2 text-xs text-zinc-400">{s.category}</span>
            <p className="mt-0.5 text-xs text-zinc-500">{s.reason}</p>
          </li>
        ))}
      </ul>
    );
  }

  if (tab === 'inspire') {
    const meals =
      (d.meals as {
        name: string;
        description: string;
        ingredients_used: string[];
        missing_ingredients: string[];
      }[]) ?? [];
    return (
      <ul className="space-y-3">
        {meals.map((m, i) => (
          <li key={i} className="rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800">
            <p className="font-semibold text-zinc-800 dark:text-zinc-100">{m.name}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{m.description}</p>
            {m.missing_ingredients?.length > 0 && (
              <p className="mt-1 text-xs text-amber-500">
                Missing: {m.missing_ingredients.join(', ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return <pre className="text-xs text-zinc-500">{JSON.stringify(data, null, 2)}</pre>;
}
