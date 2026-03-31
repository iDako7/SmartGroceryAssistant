'use client';

interface ToggleChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function ToggleChip({ label, selected, onClick }: ToggleChipProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        selected
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
          : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400'
      }`}
    >
      {label}
    </button>
  );
}
