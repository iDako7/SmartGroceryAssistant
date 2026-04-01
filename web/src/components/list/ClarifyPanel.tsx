'use client';

import { useState } from 'react';
import type { ClarifyQuestion } from '../../types';

interface Props {
  questions: ClarifyQuestion[];
  onSubmit: (answers: Record<number, string[]>) => void;
  onSkip: () => void;
}

export default function ClarifyPanel({ questions, onSubmit, onSkip }: Props) {
  const [answers, setAnswers] = useState<Record<number, string[]>>({});

  function toggleOption(qIndex: number, label: string) {
    setAnswers((prev) => {
      const current = prev[qIndex] ?? [];
      const next = current.includes(label)
        ? current.filter((l) => l !== label)
        : [...current, label];
      return { ...prev, [qIndex]: next };
    });
  }

  const answeredCount = Object.values(answers).filter((a) => a.length > 0).length;

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Quick questions for better suggestions
        </span>
        <button
          onClick={onSkip}
          className="rounded-md px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          Skip
        </button>
      </div>

      {/* Questions */}
      <div className="space-y-5 px-4 py-4">
        {questions.map((q, qi) => (
          <div key={qi}>
            <p className="mb-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {q.text}
              {q.text_zh && (
                <span className="ml-1.5 font-normal text-zinc-400"> / {q.text_zh}</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {q.options.map((opt, oi) => {
                const selected = (answers[qi] ?? []).includes(opt.label);
                return (
                  <button
                    key={oi}
                    onClick={() => toggleOption(qi, opt.label)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-500'
                    }`}
                  >
                    {opt.label}
                    {opt.label_zh && (
                      <span className="ml-1 font-normal text-zinc-400 dark:text-zinc-500">
                        {' '}
                        / {opt.label_zh}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <button
          onClick={() => onSubmit(answers)}
          disabled={answeredCount === 0}
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Get Suggestions
        </button>
      </div>
    </div>
  );
}
