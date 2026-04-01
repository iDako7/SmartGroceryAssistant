'use client';

import { getCategoryIcon } from '../../lib/category-icons';
import type { SuggestResponse } from '../../types';

interface Props {
  data: SuggestResponse;
}

export default function StoreView({ data }: Props) {
  return (
    <div className="space-y-3">
      {data.storeLayout.map((aisle, ai) => (
        <div
          key={ai}
          className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
            {(() => {
              const Icon = getCategoryIcon(aisle.emoji);
              return <Icon size={16} className="shrink-0 text-zinc-500" />;
            })()}
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {aisle.category}
            </p>
            <span className="text-xs text-zinc-400">{aisle.items.length}</span>
          </div>
          <ul className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {aisle.items.map((item, ii) => (
              <li key={ii} className="flex items-center gap-3 px-4 py-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${item.existing ? 'bg-emerald-500' : 'bg-amber-400'}`}
                />
                <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">
                  {item.name_en}
                  {item.name_zh && (
                    <span className="ml-1.5 text-xs text-zinc-400">{item.name_zh}</span>
                  )}
                </span>
                {!item.existing && (
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                    new
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
