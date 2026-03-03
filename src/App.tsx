import { useState } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface GroceryItem {
  id: string
  nameEn: string
  nameSecondary: string
  quantity: number
  checked: boolean
}

type SuggestPhase = 'idle' | 'questioning' | 'loading' | 'done'
type ActiveView = 'flat' | 'smart' | 'aisles'

interface SuggestionEntry {
  id: string; nameEn: string; nameSecondary: string
  reason: string; clusterId: string; isExtra: boolean
}
interface ClusterDef {
  id: string; emoji: string; name: string; description: string
  existingItemIds: string[]; suggestionIds: string[]
}
interface AisleGroupDef {
  id: string; name: string
  existingItemIds: string[]; suggestionIds: string[]
}
interface SuggestResult {
  contextSummary: string
  clusters: ClusterDef[]
  aisleGroups: AisleGroupDef[]
  suggestions: SuggestionEntry[]
}

interface Section {
  id: string
  name: string
  items: GroceryItem[]
  collapsed: boolean
  suggestPhase: SuggestPhase
  activeView: ActiveView
  suggestResult: SuggestResult | null
  dismissedIds: string[]
  keptIds: string[]
  moreShown: boolean
  selectedChips: Record<string, string>
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const BBQ_SUGGEST_RESULT: SuggestResult = {
  contextSummary: 'Fusion BBQ — balancing Korean and Western styles for ~2 people',
  clusters: [
    {
      id: 'c1', emoji: '🥩', name: 'Korean BBQ Core',
      description: 'Traditional Korean BBQ essentials for the grill',
      existingItemIds: ['i1', 'i2', 'i3', 'i4'], suggestionIds: ['s1', 's2'],
    },
    {
      id: 'c2', emoji: '🌭', name: 'Western BBQ Station',
      description: 'American classics to keep everyone happy',
      existingItemIds: ['i5', 'i6', 'i7', 'i8'], suggestionIds: ['s3', 's4'],
    },
    {
      id: 'c3', emoji: '🥂', name: 'Refreshments & Sides',
      description: 'Round out your BBQ spread with drinks and sides',
      existingItemIds: [], suggestionIds: ['s5', 's6', 's7'],
    },
  ],
  aisleGroups: [
    { id: 'a1', name: '🥩 Meat & Seafood', existingItemIds: ['i2'], suggestionIds: [] },
    { id: 'a2', name: '🌏 Asian Foods', existingItemIds: ['i1', 'i3', 'i4'], suggestionIds: ['s1', 's2'] },
    { id: 'a3', name: '🌭 Grocery', existingItemIds: ['i5', 'i6', 'i7'], suggestionIds: ['s3', 's4'] },
    { id: 'a4', name: '🧴 Condiments', existingItemIds: ['i8'], suggestionIds: [] },
  ],
  suggestions: [
    { id: 's1', nameEn: 'Sesame Oil', nameSecondary: '芝麻油', reason: 'Essential Korean BBQ dipping sauce base', clusterId: 'c1', isExtra: false },
    { id: 's2', nameEn: 'Gochujang', nameSecondary: '辣椒酱', reason: 'Authentic Korean BBQ marinade', clusterId: 'c1', isExtra: false },
    { id: 's3', nameEn: 'BBQ Sauce', nameSecondary: '烧烤酱', reason: 'Classic American grilling sauce', clusterId: 'c2', isExtra: false },
    { id: 's4', nameEn: 'Ketchup', nameSecondary: '番茄酱', reason: 'Perfect with hot dogs and burgers', clusterId: 'c2', isExtra: false },
    { id: 's5', nameEn: 'Corn on the Cob', nameSecondary: '玉米棒', reason: 'Great BBQ side dish', clusterId: 'c3', isExtra: false },
    { id: 's6', nameEn: 'Soju', nameSecondary: '烧酒', reason: 'Traditional Korean BBQ drink', clusterId: 'c3', isExtra: true },
    { id: 's7', nameEn: 'Coleslaw', nameSecondary: '卷心菜沙拉', reason: 'Classic BBQ side', clusterId: 'c3', isExtra: true },
  ],
}

const QUESTIONS = [
  { id: 'occasion',  label: 'Occasion / 场合',       options: ['Casual / 休闲', 'Party / 聚会', 'Family / 家庭'] },
  { id: 'headcount', label: 'Headcount / 人数',       options: ['1–2', '3–5', '6+'] },
  { id: 'sides',     label: 'Sides needed / 需要配菜', options: ['Yes / 是', 'No / 否'] },
]

// ── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_SECTIONS: Section[] = [
  {
    id: 's1',
    name: 'BBQ with Mark',
    collapsed: false,
    suggestPhase: 'idle',
    activeView: 'flat',
    suggestResult: null,
    dismissedIds: [],
    keptIds: [],
    moreShown: false,
    selectedChips: {},
    items: [
      { id: 'i1', nameEn: 'Tofu',          nameSecondary: '豆腐',    quantity: 1, checked: false },
      { id: 'i2', nameEn: 'Pork Belly',    nameSecondary: '五花肉',  quantity: 1, checked: false },
      { id: 'i3', nameEn: 'Kimchi',         nameSecondary: '泡菜',    quantity: 1, checked: false },
      { id: 'i4', nameEn: 'Seaweed',        nameSecondary: '海苔',    quantity: 1, checked: false },
      { id: 'i5', nameEn: 'Burger Patties', nameSecondary: '汉堡肉饼',quantity: 1, checked: false },
      { id: 'i6', nameEn: 'Hot Dog Buns',   nameSecondary: '热狗面包',quantity: 1, checked: false },
      { id: 'i7', nameEn: 'Hot Dogs',       nameSecondary: '热狗',    quantity: 1, checked: false },
      { id: 'i8', nameEn: 'Mustard',        nameSecondary: '芥末酱',  quantity: 1, checked: false },
    ],
  },
]

let _nextId = 100
function genId() { return `id-${_nextId++}` }

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState('')
  const [addingItemSectionId, setAddingItemSectionId] = useState<string | null>(null)
  const [addingItemText, setAddingItemText] = useState('')
  const [openQtyItemId, setOpenQtyItemId] = useState<string | null>(null)

  // ── Section operations ──────────────────────────────────────────────────────

  function addSection() {
    const id = genId()
    const newSection: Section = {
      id, name: 'New List', collapsed: false, items: [],
      suggestPhase: 'idle', activeView: 'flat', suggestResult: null,
      dismissedIds: [], keptIds: [], moreShown: false, selectedChips: {},
    }
    setSections(prev => [...prev, newSection])
    setEditingSectionId(id)
    setEditingSectionName('New List')
  }

  function startEditSection(section: Section) {
    setEditingSectionId(section.id)
    setEditingSectionName(section.name)
  }

  function commitSectionName(sectionId: string) {
    setSections(prev =>
      prev.map(s => s.id === sectionId ? { ...s, name: editingSectionName } : s)
    )
    setEditingSectionId(null)
  }

  function deleteSection(sectionId: string) {
    setSections(prev => prev.filter(s => s.id !== sectionId))
  }

  function toggleCollapse(sectionId: string) {
    setSections(prev =>
      prev.map(s => s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s)
    )
  }

  // ── Item operations ─────────────────────────────────────────────────────────

  function toggleItem(sectionId: string, itemId: string) {
    setSections(prev =>
      prev.map(s => s.id !== sectionId ? s : {
        ...s,
        items: s.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i),
      })
    )
  }

  function setItemQty(sectionId: string, itemId: string, qty: number) {
    setSections(prev =>
      prev.map(s => s.id !== sectionId ? s : {
        ...s,
        items: s.items.map(i => i.id === itemId ? { ...i, quantity: qty } : i),
      })
    )
    setOpenQtyItemId(null)
  }

  function deleteItem(sectionId: string, itemId: string) {
    setSections(prev =>
      prev.map(s => s.id !== sectionId ? s : {
        ...s,
        items: s.items.filter(i => i.id !== itemId),
      })
    )
  }

  function commitAddItem(sectionId: string) {
    const text = addingItemText.trim()
    if (!text) return
    const newItem: GroceryItem = { id: genId(), nameEn: text, nameSecondary: '', quantity: 1, checked: false }
    setSections(prev =>
      prev.map(s => s.id !== sectionId ? s : { ...s, items: [...s.items, newItem] })
    )
    setAddingItemSectionId(null)
    setAddingItemText('')
  }

  // ── Suggest operations ──────────────────────────────────────────────────────

  function openQuestions(sectionId: string) {
    setSections(prev =>
      prev.map(s => s.id !== sectionId ? s : { ...s, suggestPhase: 'questioning' })
    )
  }

  function selectChip(sectionId: string, questionId: string, value: string) {
    setSections(prev =>
      prev.map(s => s.id !== sectionId ? s : {
        ...s,
        selectedChips: { ...s.selectedChips, [questionId]: value },
      })
    )
  }

  function triggerSuggest(sectionId: string) {
    setSections(prev =>
      prev.map(s => s.id !== sectionId ? s : { ...s, suggestPhase: 'loading' })
    )
    setTimeout(() => {
      setSections(prev =>
        prev.map(s => s.id !== sectionId ? s : {
          ...s,
          suggestPhase: 'done',
          suggestResult: BBQ_SUGGEST_RESULT,
          activeView: 'smart',
        })
      )
    }, 500)
  }

  function keepSuggestion(sectionId: string, suggId: string) {
    setSections(prev =>
      prev.map(s => {
        if (s.id !== sectionId) return s
        const sugg = s.suggestResult?.suggestions.find(sg => sg.id === suggId)
        if (!sugg) return s
        const newItem: GroceryItem = {
          id: genId(), nameEn: sugg.nameEn, nameSecondary: sugg.nameSecondary,
          quantity: 1, checked: false,
        }
        return { ...s, keptIds: [...s.keptIds, suggId], items: [...s.items, newItem] }
      })
    )
  }

  function dismissSuggestion(sectionId: string, suggId: string) {
    setSections(prev =>
      prev.map(s => s.id !== sectionId ? s : { ...s, dismissedIds: [...s.dismissedIds, suggId] })
    )
  }

  function keepAll(sectionId: string) {
    setSections(prev =>
      prev.map(s => {
        if (s.id !== sectionId) return s
        const visibleSuggs = (s.suggestResult?.suggestions ?? []).filter(sg =>
          !s.dismissedIds.includes(sg.id) && !s.keptIds.includes(sg.id) &&
          (!sg.isExtra || s.moreShown)
        )
        const newItems: GroceryItem[] = visibleSuggs.map(sg => ({
          id: genId(), nameEn: sg.nameEn, nameSecondary: sg.nameSecondary,
          quantity: 1, checked: false,
        }))
        return {
          ...s,
          keptIds: [...s.keptIds, ...visibleSuggs.map(sg => sg.id)],
          items: [...s.items, ...newItems],
        }
      })
    )
  }

  function showMore(sectionId: string) {
    setSections(prev =>
      prev.map(s => s.id !== sectionId ? s : { ...s, moreShown: true })
    )
  }

  function setView(sectionId: string, view: ActiveView) {
    setSections(prev =>
      prev.map(s => s.id !== sectionId ? s : { ...s, activeView: view })
    )
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderItemRow(item: GroceryItem, sectionId: string) {
    return (
      <div
        key={item.id}
        data-testid="grocery-item"
        data-checked={item.checked ? 'true' : 'false'}
        style={{ display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, opacity: item.checked ? 0.55 : 1 }}
      >
        <div
          data-testid="checkbox-touch-target"
          data-min-height="44"
          style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}
        >
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => toggleItem(sectionId, item.id)}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#2E7D32' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <span data-testid="item-name-en" style={{ fontSize: 15, textDecoration: item.checked ? 'line-through' : 'none' }}>
            {item.nameEn}
          </span>
          {item.nameSecondary && (
            <span
              data-testid="item-name-secondary"
              style={{ fontSize: 12, color: '#aaa', marginLeft: 6 }}
            >
              {item.nameSecondary}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: '#F7F6F3', minHeight: '100vh', maxWidth: 390, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* App header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 8px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#2E7D32', margin: 0 }}>
          Smart Grocery
        </h1>
        <button
          data-testid="add-section-button"
          onClick={addSection}
          style={{ background: '#2E7D32', color: 'white', border: 'none', borderRadius: 20, width: 32, height: 32, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
        >
          +
        </button>
      </div>

      {/* Section list */}
      {sections.map(section => {
        const { suggestPhase, activeView, suggestResult, dismissedIds, keptIds, moreShown, selectedChips } = section

        const visibleSuggestions = suggestResult?.suggestions.filter(s =>
          !dismissedIds.includes(s.id) &&
          !keptIds.includes(s.id) &&
          (!s.isExtra || moreShown)
        ) ?? []

        const hasExtra = suggestResult?.suggestions.some(s =>
          s.isExtra && !dismissedIds.includes(s.id) && !keptIds.includes(s.id)
        ) ?? false

        return (
          <div
            key={section.id}
            data-testid="section-card"
            style={{ margin: '8px 16px', background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}
          >
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 6 }}>
              <button
                data-testid="section-collapse-toggle"
                data-collapsed={section.collapsed ? 'true' : 'false'}
                onClick={() => toggleCollapse(section.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 13,
                  transform: section.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                }}
              >
                ▾
              </button>

              {editingSectionId === section.id ? (
                <input
                  data-testid="section-name-input"
                  value={editingSectionName}
                  onChange={e => setEditingSectionName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitSectionName(section.id)
                    if (e.key === 'Escape') setEditingSectionId(null)
                  }}
                  autoFocus
                  style={{ flex: 1, fontSize: 15, fontWeight: 600, border: '1px solid #2E7D32', borderRadius: 6, padding: '2px 8px' }}
                />
              ) : (
                <span
                  onClick={() => startEditSection(section)}
                  style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#2E7D32', cursor: 'pointer' }}
                >
                  {section.name}
                </span>
              )}

              <button
                data-testid="suggest-button"
                onClick={() => openQuestions(section.id)}
                style={{ background: '#FF6B35', color: 'white', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Suggest
              </button>

              <button
                data-testid="delete-section-button"
                onClick={() => deleteSection(section.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 15, padding: 4 }}
                aria-label="Delete section"
              >
                🗑
              </button>
            </div>

            {/* Quick Questions panel */}
            {suggestPhase === 'questioning' && (
              <div data-testid="quick-questions-panel" style={{ padding: '8px 12px 12px' }}>
                {QUESTIONS.map(q => (
                  <div key={q.id} data-testid="question-chip-group" style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{q.label}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {q.options.map((opt, idx) => (
                        <button
                          key={idx}
                          data-testid={`chip-option-${q.id}-${idx}`}
                          data-selected={selectedChips[q.id] === opt ? 'true' : 'false'}
                          onClick={() => selectChip(section.id, q.id, opt)}
                          style={{
                            border: '1px solid #2E7D32', borderRadius: 20, padding: '4px 12px',
                            fontSize: 12, cursor: 'pointer',
                            background: selectedChips[q.id] === opt ? '#2E7D32' : 'white',
                            color: selectedChips[q.id] === opt ? 'white' : '#2E7D32',
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    data-testid="get-suggestions-button"
                    onClick={() => triggerSuggest(section.id)}
                    style={{ background: '#FF6B35', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}
                  >
                    Get Suggestions →
                  </button>
                  <button
                    data-testid="skip-suggest-button"
                    onClick={() => triggerSuggest(section.id)}
                    style={{ background: 'none', border: 'none', color: '#999', fontSize: 13, cursor: 'pointer' }}
                  >
                    Skip →
                  </button>
                </div>
              </div>
            )}

            {/* Loading state */}
            {suggestPhase === 'loading' && (
              <div data-testid="suggest-loading" style={{ padding: '12px 16px', color: '#888', fontSize: 14 }}>
                Loading suggestions…
              </div>
            )}

            {/* View tabs + views (shown when done) */}
            {suggestPhase === 'done' && (
              <>
                {/* View tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f0f0ee', padding: '0 12px' }}>
                  <button
                    data-testid="view-tab-flat"
                    onClick={() => setView(section.id, 'flat')}
                    style={{ flex: 1, border: 'none', background: 'none', padding: '8px 0', fontSize: 13, cursor: 'pointer', color: activeView === 'flat' ? '#2E7D32' : '#888', fontWeight: activeView === 'flat' ? 600 : 400 }}
                  >
                    📋 Flat
                  </button>
                  <button
                    data-testid="view-tab-smart"
                    onClick={() => setView(section.id, 'smart')}
                    style={{ flex: 1, border: 'none', background: 'none', padding: '8px 0', fontSize: 13, cursor: 'pointer', color: activeView === 'smart' ? '#2E7D32' : '#888', fontWeight: activeView === 'smart' ? 600 : 400 }}
                  >
                    ✨ Smart
                  </button>
                  <button
                    data-testid="view-tab-aisles"
                    onClick={() => setView(section.id, 'aisles')}
                    style={{ flex: 1, border: 'none', background: 'none', padding: '8px 0', fontSize: 13, cursor: 'pointer', color: activeView === 'aisles' ? '#2E7D32' : '#888', fontWeight: activeView === 'aisles' ? 600 : 400 }}
                  >
                    🏪 Aisles
                  </button>
                </div>

                {/* Flat view */}
                {activeView === 'flat' && (
                  <div data-testid="flat-view">
                    {section.items.map(item => (
                      <div
                        key={item.id}
                        data-testid="grocery-item"
                        data-checked={item.checked ? 'true' : 'false'}
                        style={{ display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, opacity: item.checked ? 0.55 : 1 }}
                      >
                        <div
                          data-testid="checkbox-touch-target"
                          data-min-height="44"
                          style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleItem(section.id, item.id)}
                            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#2E7D32' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <span data-testid="item-name-en" style={{ fontSize: 15, textDecoration: item.checked ? 'line-through' : 'none' }}>
                            {item.nameEn}
                          </span>
                          {item.nameSecondary && (
                            <span
                              data-testid="item-name-secondary"
                              style={{ fontSize: 12, color: '#aaa', marginLeft: 6 }}
                            >
                              {item.nameSecondary}
                            </span>
                          )}
                        </div>
                        <div style={{ position: 'relative' }}>
                          <button
                            data-testid="item-quantity"
                            onClick={() => setOpenQtyItemId(openQtyItemId === item.id ? null : item.id)}
                            style={{ background: '#f0f0ee', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 13, minWidth: 26 }}
                          >
                            {item.quantity}
                          </button>
                          {openQtyItemId === item.id && (
                            <div
                              data-testid="quantity-picker"
                              style={{
                                position: 'absolute', right: 0, top: '110%', background: 'white',
                                border: '1px solid #ddd', borderRadius: 8, display: 'flex',
                                flexWrap: 'wrap', width: 108, zIndex: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                              }}
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                <button
                                  key={n}
                                  data-testid={`qty-option-${n}`}
                                  onClick={() => setItemQty(section.id, item.id, n)}
                                  style={{ width: '33.33%', border: 'none', background: 'none', padding: '7px 0', cursor: 'pointer', fontSize: 14 }}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          data-testid="delete-item-button"
                          onClick={() => deleteItem(section.id, item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 13, padding: 4 }}
                          aria-label="Delete item"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {addingItemSectionId === section.id ? (
                      <div style={{ padding: '4px 12px 10px' }}>
                        <input
                          data-testid="add-item-input"
                          autoFocus
                          value={addingItemText}
                          onChange={e => setAddingItemText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitAddItem(section.id)
                            if (e.key === 'Escape') {
                              setAddingItemSectionId(null)
                              setAddingItemText('')
                            }
                          }}
                          placeholder="Item name…"
                          style={{ width: '100%', border: '1px solid #2E7D32', borderRadius: 6, padding: '6px 10px', fontSize: 14, boxSizing: 'border-box' }}
                        />
                      </div>
                    ) : (
                      <button
                        data-testid="add-item-button"
                        data-min-height="44"
                        onClick={() => { setAddingItemSectionId(section.id); setAddingItemText('') }}
                        style={{ width: '100%', minHeight: 44, background: 'none', border: 'none', textAlign: 'left', padding: '8px 12px 12px', color: '#2E7D32', fontSize: 14, cursor: 'pointer' }}
                      >
                        + Add Item
                      </button>
                    )}
                  </div>
                )}

                {/* Smart view */}
                {activeView === 'smart' && suggestResult && (
                  <div data-testid="smart-view" style={{ padding: '8px 0' }}>
                    {/* Context block */}
                    <div
                      data-testid="context-block"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f9f8f5', margin: '0 12px 8px', borderRadius: 8 }}
                    >
                      <span style={{ fontSize: 13, color: '#555' }}>{suggestResult.contextSummary}</span>
                      <button
                        data-testid="keep-all-button"
                        onClick={() => keepAll(section.id)}
                        style={{ background: '#2E7D32', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
                      >
                        ✓ Keep All
                      </button>
                    </div>

                    {/* Clusters */}
                    {suggestResult.clusters.map(cluster => {
                      const clusterSuggs = visibleSuggestions.filter(s => s.clusterId === cluster.id)
                      const clusterItems = cluster.existingItemIds
                        .map(id => section.items.find(i => i.id === id))
                        .filter(Boolean) as GroceryItem[]
                      if (clusterItems.length === 0 && clusterSuggs.length === 0) return null
                      return (
                        <div
                          key={cluster.id}
                          data-testid="cluster-card"
                          style={{ margin: '0 12px 8px', border: '1px solid #f0f0ee', borderRadius: 8, overflow: 'hidden' }}
                        >
                          <div style={{ padding: '8px 12px 4px', fontWeight: 600, fontSize: 14 }}>
                            {cluster.emoji} {cluster.name}
                          </div>
                          <div
                            data-testid="cluster-description"
                            style={{ padding: '0 12px 8px', fontSize: 12, color: '#888' }}
                          >
                            {cluster.description}
                          </div>
                          {clusterItems.map(item => renderItemRow(item, section.id))}
                          {clusterSuggs.map(sugg => (
                            <div
                              key={sugg.id}
                              data-testid="suggestion-item"
                              style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', gap: 8, background: '#fff8f5', borderTop: '1px dashed #ffd5c2' }}
                            >
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: 14 }}>✨ {sugg.nameEn}</span>
                                <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>{sugg.nameSecondary}</span>
                                <div data-testid="suggestion-reason" style={{ fontSize: 12, color: '#FF6B35', marginTop: 2 }}>
                                  {sugg.reason}
                                </div>
                              </div>
                              <button
                                data-testid="keep-button"
                                onClick={() => keepSuggestion(section.id, sugg.id)}
                                style={{ background: '#2E7D32', color: 'white', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 12, cursor: 'pointer' }}
                              >
                                Keep
                              </button>
                              <button
                                data-testid="dismiss-button"
                                onClick={() => dismissSuggestion(section.id, sugg.id)}
                                style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '3px 8px', fontSize: 12, cursor: 'pointer', color: '#aaa' }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )
                    })}

                    {/* More button */}
                    {!moreShown && hasExtra && (
                      <button
                        data-testid="more-suggestions-button"
                        onClick={() => showMore(section.id)}
                        style={{ margin: '4px 12px 8px', background: 'none', border: '1px solid #FF6B35', borderRadius: 8, padding: '6px 16px', fontSize: 13, color: '#FF6B35', cursor: 'pointer' }}
                      >
                        More
                      </button>
                    )}
                  </div>
                )}

                {/* Aisles view */}
                {activeView === 'aisles' && suggestResult && (
                  <div data-testid="aisles-view" style={{ padding: '8px 0' }}>
                    {suggestResult.aisleGroups
                      .filter(aisle => aisle.existingItemIds.length > 0 || aisle.suggestionIds.length > 0)
                      .map(aisle => {
                        const aisleItems = aisle.existingItemIds
                          .map(id => section.items.find(i => i.id === id))
                          .filter(Boolean) as GroceryItem[]
                        const aisleSuggs = aisle.suggestionIds
                          .map(id => suggestResult.suggestions.find(s => s.id === id))
                          .filter(Boolean) as SuggestionEntry[]
                        return (
                          <div
                            key={aisle.id}
                            data-testid="aisle-group"
                            style={{ margin: '0 12px 8px', border: '1px solid #f0f0ee', borderRadius: 8, overflow: 'hidden' }}
                          >
                            <div style={{ padding: '8px 12px', fontWeight: 600, fontSize: 14, background: '#f9f8f5' }}>
                              {aisle.name}
                            </div>
                            {aisleItems.map(item => renderItemRow(item, section.id))}
                            {aisleSuggs.map(sugg => (
                              <div
                                key={sugg.id}
                                data-testid="suggestion-item"
                                style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', gap: 8 }}
                              >
                                <span style={{ flex: 1, fontSize: 14 }}>{sugg.nameEn}</span>
                                <span
                                  data-testid="new-badge"
                                  style={{ background: '#FF6B35', color: 'white', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}
                                >
                                  NEW
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                  </div>
                )}
              </>
            )}

            {/* Idle state: Phase 1A rendering (items + add button) */}
            {suggestPhase === 'idle' && !section.collapsed && (
              <>
                {section.items.map(item => (
                  <div
                    key={item.id}
                    data-testid="grocery-item"
                    data-checked={item.checked ? 'true' : 'false'}
                    style={{ display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, opacity: item.checked ? 0.55 : 1 }}
                  >
                    <div
                      data-testid="checkbox-touch-target"
                      data-min-height="44"
                      style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleItem(section.id, item.id)}
                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#2E7D32' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span data-testid="item-name-en" style={{ fontSize: 15, textDecoration: item.checked ? 'line-through' : 'none' }}>
                        {item.nameEn}
                      </span>
                      {item.nameSecondary && (
                        <span
                          data-testid="item-name-secondary"
                          style={{ fontSize: 12, color: '#aaa', marginLeft: 6 }}
                        >
                          {item.nameSecondary}
                        </span>
                      )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button
                        data-testid="item-quantity"
                        onClick={() => setOpenQtyItemId(openQtyItemId === item.id ? null : item.id)}
                        style={{ background: '#f0f0ee', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 13, minWidth: 26 }}
                      >
                        {item.quantity}
                      </button>
                      {openQtyItemId === item.id && (
                        <div
                          data-testid="quantity-picker"
                          style={{
                            position: 'absolute', right: 0, top: '110%', background: 'white',
                            border: '1px solid #ddd', borderRadius: 8, display: 'flex',
                            flexWrap: 'wrap', width: 108, zIndex: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          }}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <button
                              key={n}
                              data-testid={`qty-option-${n}`}
                              onClick={() => setItemQty(section.id, item.id, n)}
                              style={{ width: '33.33%', border: 'none', background: 'none', padding: '7px 0', cursor: 'pointer', fontSize: 14 }}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      data-testid="delete-item-button"
                      onClick={() => deleteItem(section.id, item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 13, padding: 4 }}
                      aria-label="Delete item"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {addingItemSectionId === section.id ? (
                  <div style={{ padding: '4px 12px 10px' }}>
                    <input
                      data-testid="add-item-input"
                      autoFocus
                      value={addingItemText}
                      onChange={e => setAddingItemText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitAddItem(section.id)
                        if (e.key === 'Escape') {
                          setAddingItemSectionId(null)
                          setAddingItemText('')
                        }
                      }}
                      placeholder="Item name…"
                      style={{ width: '100%', border: '1px solid #2E7D32', borderRadius: 6, padding: '6px 10px', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                ) : (
                  <button
                    data-testid="add-item-button"
                    data-min-height="44"
                    onClick={() => { setAddingItemSectionId(section.id); setAddingItemText('') }}
                    style={{ width: '100%', minHeight: 44, background: 'none', border: 'none', textAlign: 'left', padding: '8px 12px 12px', color: '#2E7D32', fontSize: 14, cursor: 'pointer' }}
                  >
                    + Add Item
                  </button>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
