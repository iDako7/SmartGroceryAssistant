'use client';

import { FormEvent, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Wand2, X } from 'lucide-react';
import { lists } from '../../lib/api';
import type { ClarifyQuestion, Item, Section } from '../../types';
import ClarifyPanel from './ClarifyPanel';
import ItemRow from './ItemRow';

interface Props {
  section: Section;
  items: Item[];
  selectedItem: Item | null;
  onSelectItem: (item: Item) => void;
  onItemUpdated: (item: Item) => void;
  onItemDeleted: (sectionId: string, itemId: string) => void;
  onItemCreated: (sectionId: string, item: Item) => void;
  onSectionDeleted: (id: string) => void;
  onSectionUpdated: (section: Section) => void;
  onSuggest?: (sectionId: string) => void;
}

export default function SectionCard({
  section,
  items,
  selectedItem,
  onSelectItem,
  onItemUpdated,
  onItemDeleted,
  onItemCreated,
  onSectionDeleted,
  onSectionUpdated,
  onSuggest,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [sectionName, setSectionName] = useState(section.name);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [showClarify, setShowClarify] = useState(false);
  const [clarifyQuestions, setClarifyQuestions] = useState<ClarifyQuestion[]>([]);

  async function saveSectionName() {
    if (sectionName.trim() === section.name) {
      setEditingName(false);
      return;
    }
    const updated = await lists.updateSection(section.id, { name: sectionName.trim() });
    onSectionUpdated(updated as Section);
    setEditingName(false);
  }

  async function handleAddItem(e: FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const item = await lists.createItem(section.id, newItemName.trim());
    onItemCreated(section.id, item as Item);
    setNewItemName('');
    setAddingItem(false);
  }

  async function handleSuggestClick() {
    // TODO: replace mock with `POST /api/v1/ai/clarify` when API is ready
    const mockQuestions: ClarifyQuestion[] = [
      {
        text: 'What kind of meal are you planning?',
        text_zh: '你打算做什么类型的饭菜？',
        options: [
          { label: 'Weeknight dinner', label_zh: '工作日晚餐' },
          { label: 'BBQ / Party', label_zh: '烧烤/聚会' },
          { label: 'Meal prep', label_zh: '提前备餐' },
          { label: 'Other...', label_zh: '其他...' },
        ],
      },
      {
        text: 'How many people will be eating?',
        text_zh: '有多少人一起吃？',
        options: [
          { label: 'Just 2 of us', label_zh: '就我们两个' },
          { label: 'Small group (4-6)', label_zh: '小聚会(4-6人)' },
          { label: 'Larger party (7+)', label_zh: '大聚会(7人以上)' },
          { label: 'Other...', label_zh: '其他...' },
        ],
      },
      {
        text: 'Are you missing anything?',
        text_zh: '还缺什么吗？',
        options: [
          { label: 'Vegetables', label_zh: '蔬菜' },
          { label: 'Drinks', label_zh: '饮料' },
          { label: 'Sauces & seasonings', label_zh: '酱料调味' },
          { label: 'All set', label_zh: '都齐了' },
          { label: 'Other...', label_zh: '其他...' },
        ],
      },
    ];
    setClarifyQuestions(mockQuestions);
    setShowClarify(true);
    setCollapsed(false);
  }

  function handleClarifySubmit(answers: Record<number, string[]>) {
    // TODO: submit answers as context to suggest endpoint
    setShowClarify(false);
    if (onSuggest) onSuggest(section.id);
  }

  function handleClarifySkip() {
    setShowClarify(false);
    if (onSuggest) onSuggest(section.id);
  }

  const doneCount = items.filter((i) => i.checked).length;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>

        {editingName ? (
          <input
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            onBlur={saveSectionName}
            onKeyDown={(e) => e.key === 'Enter' && saveSectionName()}
            autoFocus
            className="flex-1 rounded border border-zinc-300 px-2 py-0.5 text-sm font-semibold outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="flex-1 text-left text-sm font-semibold text-zinc-800 hover:text-emerald-600 dark:text-zinc-200"
          >
            {section.name}
          </button>
        )}

        <span className="text-xs text-zinc-400">
          {doneCount}/{items.length}
        </span>

        {onSuggest && (
          <button
            onClick={handleSuggestClick}
            className="flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
          >
            <Wand2 size={12} />
            Suggest
          </button>
        )}

        <button
          onClick={() => onSectionDeleted(section.id)}
          className="rounded p-0.5 text-zinc-300 transition hover:text-red-500 dark:text-zinc-600"
          title="Delete section"
        >
          <X size={14} />
        </button>
      </div>

      {/* Items */}
      {!collapsed && (
        <div className="border-t border-zinc-100 px-4 pb-3 dark:border-zinc-800">
          <ul className="mt-2 space-y-0.5">
            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                selected={selectedItem?.id === item.id}
                onSelect={onSelectItem}
                onUpdated={onItemUpdated}
                onDeleted={(id) => onItemDeleted(section.id, id)}
              />
            ))}
          </ul>

          {showClarify && (
            <ClarifyPanel
              questions={clarifyQuestions}
              onSubmit={handleClarifySubmit}
              onSkip={handleClarifySkip}
            />
          )}

          {addingItem ? (
            <form onSubmit={handleAddItem} className="mt-2 flex gap-2">
              <input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Item name"
                autoFocus
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAddingItem(false)}
                className="text-sm text-zinc-400 hover:underline"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAddingItem(true)}
              className="mt-2 flex items-center gap-1 text-sm text-zinc-400 hover:text-emerald-600"
            >
              <Plus size={14} />
              Add item
            </button>
          )}
        </div>
      )}
    </div>
  );
}
