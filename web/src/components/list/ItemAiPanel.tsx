'use client';

import { useState } from 'react';
import { ai } from '../../lib/api';

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
          // Per-item inspire uses suggest-like sections but we just pass the single item
          setResult(await ai.itemInfo(itemName)); // placeholder — inspire per-item TBD
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
      {!loading && !error && result && <ResultContent feature={feature} data={result} />}
    </div>
  );
}

function ResultContent({ feature, data }: { feature: AiFeature; data: unknown }) {
  const d = data as Record<string, unknown>;

  if (feature === 'info') {
    const fields = ['category', 'typical_unit', 'storage_tip', 'nutrition_note'] as const;
    return (
      <dl className="space-y-1">
        {fields.map((k) => (
          <div key={k} className="flex gap-2">
            <dt className="shrink-0 text-xs font-medium text-zinc-400 capitalize">
              {k.replace(/_/g, ' ')}:
            </dt>
            <dd className="text-xs text-zinc-700 dark:text-zinc-300">{String(d[k] ?? '—')}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if (feature === 'alternatives') {
    const alts = (d.alternatives as { name: string; reason: string }[]) ?? [];
    if (alts.length === 0) return <p className="text-xs text-zinc-400">No alternatives found.</p>;
    return (
      <ul className="space-y-1.5">
        {alts.map((a, i) => (
          <li key={i} className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{a.name}</span>
            <span className="text-xs text-zinc-400">{a.reason}</span>
          </li>
        ))}
      </ul>
    );
  }

  // inspire — reuse info display for now, will update when per-item inspire endpoint is ready
  return <pre className="text-xs text-zinc-500">{JSON.stringify(data, null, 2)}</pre>;
}
