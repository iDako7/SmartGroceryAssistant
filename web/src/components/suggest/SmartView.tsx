'use client';

import { Check, ShoppingBasket, X } from 'lucide-react';
import { getCategoryIcon } from '../../lib/category-icons';
import type { SuggestResponse } from '../../types';

interface Props {
  data: SuggestResponse;
  onKeep: (nameEn: string) => void;
  onDismiss: (nameEn: string) => void;
  onKeepAll: () => void;
  dismissed: Set<string>;
}

export default function SmartView({ data, onKeep, onDismiss, onKeepAll, dismissed }: Props) {
  return (
    <div className="space-y-4">
      {/* Recipe clusters */}
      {data.clusters.map((cluster, ci) => (
        <div
          key={ci}
          className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
            {(() => {
              const Icon = getCategoryIcon(cluster.emoji);
              return <Icon size={16} className="shrink-0 text-zinc-500" />;
            })()}
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {cluster.name}
              </p>
              <p className="text-xs text-zinc-400">{cluster.desc}</p>
            </div>
          </div>
          <ul className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {cluster.items
              .filter((item) => !dismissed.has(item.name_en))
              .map((item, ii) => (
                <li key={ii} className="flex items-center gap-3 px-4 py-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${item.existing ? 'bg-emerald-500' : 'bg-amber-400'}`}
                  />
                  <div className="flex-1">
                    <span className="text-sm text-zinc-800 dark:text-zinc-200">{item.name_en}</span>
                    {item.name_zh && (
                      <span className="ml-1.5 text-xs text-zinc-400">{item.name_zh}</span>
                    )}
                    {item.why && <p className="text-xs text-zinc-400">{item.why}</p>}
                  </div>
                  {item.existing ? (
                    <span className="text-xs text-zinc-400">in list</span>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onKeep(item.name_en)}
                        className="rounded p-1 text-zinc-400 transition hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950"
                        title="Keep"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => onDismiss(item.name_en)}
                        className="rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                        title="Dismiss"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </div>
      ))}

      {/* Ungrouped items */}
      {data.ungrouped.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
            <ShoppingBasket size={16} className="shrink-0 text-zinc-500" />
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Other items</p>
          </div>
          <ul className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {data.ungrouped
              .filter((item) => !dismissed.has(item.name_en))
              .map((item, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${item.existing ? 'bg-emerald-500' : 'bg-amber-400'}`}
                  />
                  <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">
                    {item.name_en}
                    {item.name_zh && (
                      <span className="ml-1.5 text-xs text-zinc-400">{item.name_zh}</span>
                    )}
                  </span>
                  {item.existing && <span className="text-xs text-zinc-400">in list</span>}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Keep All */}
      <button
        onClick={onKeepAll}
        className="w-full rounded-lg border border-emerald-200 py-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
      >
        Keep All Suggestions
      </button>
    </div>
  );
}
