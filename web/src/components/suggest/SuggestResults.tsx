'use client';

import { useState } from 'react';
import { LayoutGrid, List, X } from 'lucide-react';
import type { SuggestResponse } from '../../types';
import SmartView from './SmartView';
import StoreView from './StoreView';

type ViewMode = 'smart' | 'store';

interface Props {
  data: SuggestResponse;
  onKeep: (nameEn: string) => void;
  onKeepAll: () => void;
  onClose: () => void;
}

export default function SuggestResults({ data, onKeep, onKeepAll, onClose }: Props) {
  const [view, setView] = useState<ViewMode>('smart');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  function handleDismiss(nameEn: string) {
    setDismissed((prev) => new Set(prev).add(nameEn));
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/50">
      {/* Header with toggle */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Suggestions
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
            <button
              onClick={() => setView('smart')}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                view === 'smart'
                  ? 'bg-white text-zinc-800 shadow-sm dark:bg-zinc-800 dark:text-zinc-200'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <LayoutGrid size={12} />
              Smart
            </button>
            <button
              onClick={() => setView('store')}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                view === 'store'
                  ? 'bg-white text-zinc-800 shadow-sm dark:bg-zinc-800 dark:text-zinc-200'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <List size={12} />
              Store
            </button>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 transition hover:text-zinc-600"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Context block */}
      {data.reason && (
        <div className="border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">{data.reason}</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 border-b border-zinc-100 px-4 py-1.5 dark:border-zinc-800">
        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Already in list
        </span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Suggested
        </span>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto p-4">
        {view === 'smart' ? (
          <SmartView
            data={data}
            onKeep={onKeep}
            onDismiss={handleDismiss}
            onKeepAll={onKeepAll}
            dismissed={dismissed}
          />
        ) : (
          <StoreView data={data} />
        )}
      </div>
    </div>
  );
}
