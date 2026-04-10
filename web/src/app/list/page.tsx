'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { lists } from '../../lib/api';
import SectionCard from '../../components/list/SectionCard';
import AiPanel from '../../components/ai/AiPanel';
import type { Item, Section } from '../../types';

export default function ListPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [sections, setSections] = useState<Section[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, Item[]>>({});
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [addingSection, setAddingSection] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  // Load full list
  useEffect(() => {
    if (!user) return;
    lists
      .full()
      .then((data) => {
        const secs = data.sections as (Section & { items?: Item[] })[];
        setSections(
          secs.map((s) => ({ id: s.id, user_id: s.user_id, name: s.name, position: s.position }))
        );
        const map: Record<string, Item[]> = {};
        for (const sec of secs) {
          map[sec.id] = sec.items ?? [];
        }
        setItemsMap(map);
      })
      .finally(() => setLoadingList(false));
  }, [user]);

  async function handleAddSection(e: FormEvent) {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    const section = await lists.createSection(newSectionName.trim(), sections.length);
    setSections((prev) => [...prev, section as Section]);
    setItemsMap((prev) => ({ ...prev, [(section as Section).id]: [] }));
    setNewSectionName('');
    setAddingSection(false);
  }

  async function handleDeleteSection(id: string) {
    await lists.deleteSection(id);
    setSections((prev) => prev.filter((s) => s.id !== id));
    setItemsMap((prev) => {
      const m = { ...prev };
      delete m[id];
      return m;
    });
    if (selectedItem && itemsMap[id]?.some((i) => i.id === selectedItem.id)) {
      setSelectedItem(null);
    }
  }

  function handleSectionUpdated(updated: Section) {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  function handleItemUpdated(item: Item) {
    setItemsMap((prev) => ({
      ...prev,
      [item.section_id]: prev[item.section_id]?.map((i) => (i.id === item.id ? item : i)) ?? [],
    }));
    if (selectedItem?.id === item.id) setSelectedItem(item);
  }

  function handleItemDeleted(sectionId: string, itemId: string) {
    setItemsMap((prev) => ({
      ...prev,
      [sectionId]: prev[sectionId]?.filter((i) => i.id !== itemId) ?? [],
    }));
    if (selectedItem?.id === itemId) setSelectedItem(null);
  }

  function handleItemCreated(sectionId: string, item: Item) {
    setItemsMap((prev) => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] ?? []), item],
    }));
  }

  if (authLoading || loadingList) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Smart Grocery</h1>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-sm text-zinc-500 transition hover:text-emerald-600">
            {user?.email}
          </Link>
          <button
            onClick={() => setAiOpen((o) => !o)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              aiOpen
                ? 'bg-emerald-600 text-white'
                : 'border border-zinc-200 text-zinc-600 hover:border-emerald-300 hover:text-emerald-600 dark:border-zinc-700'
            }`}
          >
            AI
          </button>
          <button
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* List */}
        <main className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {sections.length === 0 && !addingSection && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-zinc-400">
                Your list is empty. Add a section to get started.
              </p>
            </div>
          )}

          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              items={itemsMap[section.id] ?? []}
              selectedItem={selectedItem}
              onSelectItem={(item) =>
                setSelectedItem((prev) => (prev?.id === item.id ? null : item))
              }
              onItemUpdated={handleItemUpdated}
              onItemDeleted={handleItemDeleted}
              onItemCreated={handleItemCreated}
              onSectionDeleted={handleDeleteSection}
              onSectionUpdated={handleSectionUpdated}
              onSuggest={(sectionId) => {
                // TODO: integrate with clarify → suggest two-step flow
                setAiOpen(true);
              }}
              userLanguage={user?.language_preference}
            />
          ))}

          {/* Add section */}
          {addingSection ? (
            <form onSubmit={handleAddSection} className="flex gap-2">
              <input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Section name (e.g. Produce)"
                autoFocus
                className="min-w-0 flex-1 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAddingSection(false)}
                className="text-sm text-zinc-400 hover:underline"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAddingSection(true)}
              className="rounded-xl border border-dashed border-zinc-300 py-3 text-sm text-zinc-400 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-700"
            >
              + New section
            </button>
          )}
        </main>

        {/* AI panel */}
        {aiOpen && (
          <aside className="w-80 shrink-0 overflow-hidden">
            <AiPanel sections={sections} items={itemsMap} selectedItem={selectedItem} />
          </aside>
        )}
      </div>
    </div>
  );
}
