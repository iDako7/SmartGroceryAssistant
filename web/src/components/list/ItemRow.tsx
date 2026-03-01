'use client';

import { useState } from 'react';
import { lists } from '../../lib/api';
import type { Item } from '../../types';

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

  async function toggleCheck() {
    const updated = await lists.updateItem(item.id, { checked: !item.checked });
    onUpdated(updated as Item);
  }

  async function saveEdit() {
    const updated = await lists.updateItem(item.id, { name_en: name, quantity: qty });
    onUpdated(updated as Item);
    setEditing(false);
  }

  async function handleDelete() {
    await lists.deleteItem(item.id);
    onDeleted(item.id);
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

  return (
    <li
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
        onChange={toggleCheck}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 cursor-pointer accent-emerald-600"
      />

      <span
        className={`flex-1 text-sm ${item.checked ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}
      >
        {item.name_en}
        {item.name_secondary && (
          <span className="ml-1.5 text-xs text-zinc-400">{item.name_secondary}</span>
        )}
      </span>

      {item.quantity > 1 && <span className="text-xs text-zinc-400">×{item.quantity}</span>}

      <div className="invisible flex gap-1 group-hover:visible">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="rounded p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="rounded p-0.5 text-zinc-400 hover:text-red-500"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </li>
  );
}
