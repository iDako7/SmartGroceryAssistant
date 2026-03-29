'use client';

import { useState } from 'react';
import { ai } from '../../lib/api';
import type { AlternativesResponse, ItemInfoResponse, PerItemInspireResponse } from '../../types';

type AiFeature = 'info' | 'alternatives' | 'inspire';

interface Props {
  itemName: string;
  feature: AiFeature;
  onClose: () => void;
}

export default function ItemAiPanel({ itemName, feature, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch on mount
  useState(() => {
    (async () => {
      try {
        if (feature === 'info') {
          setResult(await ai.itemInfo(itemName));
        } else if (feature === 'alternatives') {
          setResult(await ai.alternatives(itemName));
        } else if (feature === 'inspire') {
          setResult(await ai.itemInfo(itemName)); // placeholder until per-item inspire endpoint exists
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  });

  return (
    <div className="mt-1 mb-1 ml-6 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium tracking-wider text-zinc-400 uppercase">
          {feature === 'info' && 'Item Info'}
          {feature === 'alternatives' && 'Alternatives'}
          {feature === 'inspire' && 'Inspire'}
        </span>
        <button
          onClick={onClose}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Close
        </button>
      </div>

      {loading && <p className="text-xs text-zinc-400">Loading...</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!loading && !error && result != null && <ResultContent feature={feature} data={result} />}
    </div>
  );
}

function ResultContent({ feature, data }: { feature: AiFeature; data: unknown }) {
  if (feature === 'info') {
    const d = data as ItemInfoResponse;
    const fields: { key: keyof ItemInfoResponse; label: string }[] = [
      { key: 'taste', label: 'Taste' },
      { key: 'usage', label: 'Usage' },
      { key: 'picking', label: 'How to pick' },
      { key: 'storage', label: 'Storage' },
      { key: 'funFact', label: 'Fun fact' },
    ];
    return (
      <dl className="space-y-1">
        {fields.map(({ key, label }) => (
          <div key={key} className="flex gap-2">
            <dt className="shrink-0 text-xs font-medium text-zinc-400">{label}:</dt>
            <dd className="text-xs text-zinc-700 dark:text-zinc-300">{String(d[key] ?? '—')}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if (feature === 'alternatives') {
    const d = data as AlternativesResponse;
    const alts = d.alts ?? [];
    if (alts.length === 0) return <p className="text-xs text-zinc-400">No alternatives found.</p>;
    return (
      <div>
        {d.note && <p className="mb-2 text-xs text-zinc-500">{d.note}</p>}
        <ul className="space-y-1.5">
          {alts.map((a, i) => (
            <li key={i} className="rounded-md bg-white px-2 py-1.5 dark:bg-zinc-800">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  {a.name_en}
                </span>
                {a.name_zh && <span className="text-xs text-zinc-400">{a.name_zh}</span>}
                <span className="ml-auto text-xs text-emerald-600">{a.match}</span>
              </div>
              {a.desc && <p className="mt-0.5 text-xs text-zinc-500">{a.desc}</p>}
              {a.where && <p className="mt-0.5 text-xs text-zinc-400">📍 {a.where}</p>}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (feature === 'inspire') {
    const d = data as PerItemInspireResponse;
    const recipes = d.recipes ?? [];
    if (recipes.length === 0) return <p className="text-xs text-zinc-400">No recipes found.</p>;
    return (
      <ul className="space-y-2">
        {recipes.map((r, i) => (
          <li key={i} className="rounded-md bg-white px-2 py-1.5 dark:bg-zinc-800">
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              {r.emoji} {r.name}
              {r.name_zh && <span className="ml-1 text-zinc-400">{r.name_zh}</span>}
            </p>
            {r.desc && <p className="mt-0.5 text-xs text-zinc-500">{r.desc}</p>}
            {r.add?.length > 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Missing: {r.add.map((a) => a.name_en).join(', ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return <pre className="text-xs text-zinc-500">{JSON.stringify(data, null, 2)}</pre>;
}
