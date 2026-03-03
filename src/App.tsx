import { useState } from 'react'

interface GroceryItem {
  id: string
  nameEn: string
  nameSecondary: string
  quantity: number
  checked: boolean
}

interface Section {
  id: string
  name: string
  items: GroceryItem[]
  collapsed: boolean
}

const INITIAL_SECTIONS: Section[] = [
  {
    id: 's1',
    name: 'BBQ with Mark',
    collapsed: false,
    items: [
      { id: 'i1', nameEn: 'Tofu',         nameSecondary: '豆腐',    quantity: 1, checked: false },
      { id: 'i2', nameEn: 'Pork Belly',   nameSecondary: '五花肉',  quantity: 1, checked: false },
      { id: 'i3', nameEn: 'Kimchi',        nameSecondary: '泡菜',    quantity: 1, checked: false },
      { id: 'i4', nameEn: 'Seaweed',       nameSecondary: '海苔',    quantity: 1, checked: false },
      { id: 'i5', nameEn: 'Burger Patties',nameSecondary: '汉堡肉饼',quantity: 1, checked: false },
      { id: 'i6', nameEn: 'Hot Dog Buns',  nameSecondary: '热狗面包',quantity: 1, checked: false },
      { id: 'i7', nameEn: 'Hot Dogs',      nameSecondary: '热狗',    quantity: 1, checked: false },
      { id: 'i8', nameEn: 'Mustard',       nameSecondary: '芥末酱',  quantity: 1, checked: false },
    ],
  },
]

let _nextId = 100
function genId() { return `id-${_nextId++}` }

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
    const newSection: Section = { id, name: 'New List', collapsed: false, items: [] }
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
      {sections.map(section => (
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

          {/* Items (conditionally rendered — not CSS hidden) */}
          {!section.collapsed && (
            <>
              {section.items.map(item => (
                <div
                  key={item.id}
                  data-testid="grocery-item"
                  data-checked={item.checked ? 'true' : 'false'}
                  style={{ display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, opacity: item.checked ? 0.55 : 1 }}
                >
                  {/* Checkbox with 44px touch target */}
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

                  {/* Item name */}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 15, textDecoration: item.checked ? 'line-through' : 'none' }}>
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

                  {/* Quantity badge + picker */}
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

                  {/* Delete item */}
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

              {/* Add item row */}
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
      ))}
    </div>
  )
}
