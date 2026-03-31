'use client';

import { useState } from 'react';
import { ArrowLeftRight, Info, Lightbulb, Pencil, Trash2 } from 'lucide-react';
import { lists } from '../../lib/api';
import type { Item } from '../../types';
import ItemAiPanel from './ItemAiPanel';

type AiFeature = 'info' | 'alternatives' | 'inspire';

interface Props {
  item: Item;
  selected: boolean;
  onSelect: (item: Item) => void;
  onUpdated: (item: Item) => void;
  onDeleted: (id: string) => void;
}

export default function ItemRow({ item, selected, onSelect, onUpdated, onDeleted }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name_en);
  const [qty, setQty] = useState(item.quantity);
  const [aiFeature, setAiFeature] = useState<AiFeature | null>(null);

  async function saveEdit() {
    const updated = await lists.updateItem(item.id, { name_en: name, quantity: qty });
    onUpdated(updated as Item);
    setEditing(false);
  }

  async function handleDelete() {
    await lists.deleteItem(item.id);
    onDeleted(item.id);
  }

  function toggleAi(feature: AiFeature) {
    setAiFeature((prev) => (prev === feature ? null : feature));
  }

  if (editing) {
    return (
      <li className="flex items-center gap-2 py-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          autoFocus
        />
        <input
          type="number"
          value={qty}
          min={1}
          onChange={(e) => setQty(Number(e.target.value))}
          className="w-14 rounded border border-zinc-300 px-2 py-1 text-center text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <button onClick={saveEdit} className="text-xs font-medium text-emerald-600 hover:underline">
          Save
        </button>
        <button onClick={() => setEditing(false)} className="text-xs text-zinc-400 hover:underline">
          Cancel
        </button>
      </li>
    );
  }

  const iconBase = 'rounded p-1 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100';
  const iconIdle = 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300';
  const iconActive = 'text-emerald-600 !opacity-100';

  return (
    <li>
      <div
        className={`group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition ${
          selected
            ? 'bg-emerald-50 dark:bg-emerald-950/30'
            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
        }`}
        onClick={() => onSelect(item)}
      >
        <input
          type="checkbox"
          checked={item.checked}
          onClick={(e) => e.stopPropagation()}
          onChange={async () => {
            const updated = await lists.updateItem(item.id, { checked: !item.checked });
            onUpdated(updated as Item);
          }}
          className="h-4 w-4 accent-emerald-600"
        />
        <span
          className={`flex-1 text-sm ${item.checked ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}
        >
          {item.name_en}
          {item.name_secondary && (
            <span className="ml-1.5 text-xs text-zinc-400">{item.name_secondary}</span>
          )}
        </span>

        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleAi('info');
            }}
            className={`${iconBase} ${aiFeature === 'info' ? iconActive : iconIdle}`}
            title="Item Info"
          >
            <Info size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleAi('alternatives');
            }}
            className={`${iconBase} ${aiFeature === 'alternatives' ? iconActive : iconIdle}`}
            title="Alternatives"
          >
            <ArrowLeftRight size={14} />
          </button>

          <span className="min-w-[1.5rem] text-center text-xs font-medium text-zinc-400">
            {item.quantity}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleAi('inspire');
            }}
            className={`${iconBase} ${aiFeature === 'inspire' ? iconActive : iconIdle}`}
            title="Inspire"
          >
            <Lightbulb size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className={`${iconBase} ${iconIdle}`}
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className={`${iconBase} text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400`}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {aiFeature && (
        <ItemAiPanel
          itemName={item.name_en}
          feature={aiFeature}
          onClose={() => setAiFeature(null)}
        />
      )}
    </li>
  );
}
