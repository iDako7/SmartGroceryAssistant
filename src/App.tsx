import { useState, type ReactNode } from 'react'

// ── Design Tokens ─────────────────────────────────────────────────────────────

const T = {
  bg: '#F7F6F3', card: '#FFFFFF',
  green: '#2E7D32', greenLight: '#E8F5E9',
  coral: '#FF6B35', coralLight: '#FEF3EC', coralBg: '#FEF7ED',
  text: '#222222', textSec: '#717171', textTer: '#A0A0A0',
  border: 'rgba(0,0,0,.06)',
  shadow: '0 2px 12px rgba(0,0,0,.06)',
  radius: 14, radiusSm: 10,
  font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function ChevDownIcon({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <path d="M3 4h9M6 4V3h3v1M5 4v7a1 1 0 001 1h3a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SparklesIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="currentColor">
      <path d="M6.5 0l1.2 4.3L12 6.5l-4.3 1.2L6.5 12l-1.2-4.3L1 6.5l4.3-1.2z" />
    </svg>
  )
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function InfoSvg({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 5.5v3M6 3.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function SwapSvg({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M1 4h8M7 2l2 2-2 2M11 8H3M5 6l-2 2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BulbSvg({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1a3.5 3.5 0 011.5 6.7V9h-3V7.7A3.5 3.5 0 016.5 1z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 10h3M5.5 11.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function EditSvg({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M8 1.5l2.5 2.5L4 10.5H1.5V8L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Helper Components ─────────────────────────────────────────────────────────

interface RoundCheckboxProps {
  checked: boolean
  onChange: () => void
  size?: number
}

function RoundCheckbox({ checked, onChange, size = 22 }: RoundCheckboxProps) {
  return (
    <label
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        border: checked ? `2px solid ${T.green}` : '2px solid #D0D0D0',
        background: checked ? T.green : 'transparent',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .15s ease',
        boxSizing: 'border-box',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, margin: 0 }}
      />
      {checked && (
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </label>
  )
}

interface TinyBtnProps {
  onClick?: () => void
  children: React.ReactNode
  title?: string
  'data-testid'?: string
}

function TinyBtn({ onClick, children, title, 'data-testid': testId }: TinyBtnProps) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      title={title}
      style={{
        padding: 3, background: 'none', border: 'none', cursor: 'pointer',
        color: T.textTer, opacity: 0.7, display: 'flex', alignItems: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

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

// ── Education Panel Types ────────────────────────────────────────────────────

type PanelType = 'info' | 'alternatives' | 'inspire'

interface ItemInfoData {
  tasteProfile: string
  commonUses: string
  howToPick: string
  storageTips: string
  funFact: string
}

interface AlternativeItem {
  nameEn: string
  nameSecondary: string
  matchLevel: 'Very close' | 'Similar' | 'Different but works'
  comparison: string
  aisleHint: string
}

interface RecipeIngredient { nameEn: string; nameSecondary: string }

interface RecipeItem {
  name: string
  nameSecondary: string
  description: string
  missingIngredients: RecipeIngredient[]
}

interface ItemPanelCache {
  info?: ItemInfoData
  alternatives?: { alternatives: AlternativeItem[] }
  inspire?: { recipes: RecipeItem[] }
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

interface UserProfile {
  language: 'en' | 'en_zh' | 'en_fr'
  dietary: string[]
  householdSize: number
  tastePrefs: string
}

const DIETARY_OPTIONS = [
  { slug: 'vegetarian', label: 'Vegetarian' },
  { slug: 'vegan', label: 'Vegan' },
  { slug: 'gluten-free', label: 'Gluten-Free' },
  { slug: 'halal', label: 'Halal' },
  { slug: 'dairy-free', label: 'Dairy-Free' },
]

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

// ── Education Mock Data ───────────────────────────────────────────────────────

const MOCK_EDUCATION: Record<string, ItemPanelCache> = {
  i2: {
    info: {
      tasteProfile: 'Rich, fatty, and savory with a perfect balance of meat and fat that becomes meltingly tender when cooked.',
      commonUses: 'Korean BBQ (samgyeopsal), Chinese red-braised pork (hong shao rou), ramen topping, sandwiches.',
      howToPick: 'Look for even layers of fat and meat. Fresh pork belly should be pink, not gray. The fat should be white and firm.',
      storageTips: 'Keep refrigerated and use within 2–3 days, or freeze for up to 3 months. Wrap tightly to prevent freezer burn.',
      funFact: 'In Korea, samgyeopsal (grilled pork belly) is the most popular BBQ dish — "three-layer flesh" refers to alternating fat and meat layers.',
    },
    alternatives: {
      alternatives: [
        { nameEn: 'Pork Shoulder', nameSecondary: '猪肩肉', matchLevel: 'Very close', comparison: 'Similar fat content and flavor. Great for BBQ, just needs a bit longer to cook.', aisleHint: 'Meat & Seafood aisle' },
        { nameEn: 'Beef Short Ribs', nameSecondary: '牛小排', matchLevel: 'Similar', comparison: 'Richer, beefier flavor. Korean-style galbi is a classic BBQ alternative.', aisleHint: 'Meat & Seafood aisle' },
        { nameEn: 'Chicken Thighs', nameSecondary: '鸡腿肉', matchLevel: 'Different but works', comparison: 'Leaner and lighter. Marinates well and cooks faster on the grill.', aisleHint: 'Meat & Seafood aisle' },
      ],
    },
  },
  i3: {
    inspire: {
      recipes: [
        { name: 'Kimchi Jjigae', nameSecondary: '泡菜汤', description: 'A hearty Korean stew with kimchi, tofu, and pork.', missingIngredients: [{ nameEn: 'Gochugaru', nameSecondary: '辣椒粉' }, { nameEn: 'Anchovy Stock', nameSecondary: '鱼汤' }, { nameEn: 'Green Onions', nameSecondary: '葱' }] },
        { name: 'Kimchi Fried Rice', nameSecondary: '泡菜炒饭', description: 'Quick and satisfying fried rice using fermented kimchi.', missingIngredients: [{ nameEn: 'Cooked Rice', nameSecondary: '米饭' }, { nameEn: 'Sesame Oil', nameSecondary: '芝麻油' }] },
        { name: 'Kimchi Burger Topping', nameSecondary: '泡菜汉堡配料', description: 'Elevate your burgers with tangy, spicy kimchi.', missingIngredients: [{ nameEn: 'Mayo', nameSecondary: '蛋黄酱' }, { nameEn: 'Sesame Seeds', nameSecondary: '芝麻' }] },
      ],
    },
  },
}

function buildFallbackPanelData(itemName: string, type: PanelType): ItemPanelCache {
  if (type === 'info') {
    return { info: { tasteProfile: `${itemName} has a distinctive flavor profile.`, commonUses: 'Commonly used in various dishes.', howToPick: `Look for fresh, high-quality ${itemName}.`, storageTips: 'Store in a cool, dry place or refrigerate as needed.', funFact: `${itemName} is enjoyed in many cuisines around the world.` } }
  }
  if (type === 'alternatives') {
    return { alternatives: { alternatives: [{ nameEn: 'Option A', nameSecondary: '', matchLevel: 'Very close', comparison: 'Similar in taste and texture.', aisleHint: 'General grocery aisle' }, { nameEn: 'Option B', nameSecondary: '', matchLevel: 'Similar', comparison: 'Works well as a substitute.', aisleHint: 'General grocery aisle' }, { nameEn: 'Option C', nameSecondary: '', matchLevel: 'Different but works', comparison: 'Different but can be used.', aisleHint: 'General grocery aisle' }] } }
  }
  return { inspire: { recipes: [{ name: `${itemName} Dish 1`, nameSecondary: '', description: 'A delicious preparation.', missingIngredients: [{ nameEn: 'Spice Mix', nameSecondary: '' }] }, { name: `${itemName} Dish 2`, nameSecondary: '', description: 'Another great option.', missingIngredients: [{ nameEn: 'Sauce', nameSecondary: '' }] }, { name: `${itemName} Dish 3`, nameSecondary: '', description: 'Creative and tasty.', missingIngredients: [{ nameEn: 'Herbs', nameSecondary: '' }] }] } }
}

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
  const [openPanel, setOpenPanel] = useState<{ itemId: string; type: PanelType; loading: boolean } | null>(null)
  const [panelCache, setPanelCache] = useState<Record<string, ItemPanelCache>>({})

  // ── Onboarding state ─────────────────────────────────────────────────────────

  type AppScreen = 'onboarding' | 'list' | 'profile-editor'
  const [appScreen, setAppScreen] = useState<AppScreen>('onboarding')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [formLanguage, setFormLanguage] = useState<'en' | 'en_zh' | 'en_fr'>('en_zh')
  const [formDietary, setFormDietary] = useState<string[]>([])
  const [formHouseholdSize, setFormHouseholdSize] = useState<number>(2)
  const [formTastePrefs, setFormTastePrefs] = useState<string>('')

  // ── Language-aware Quick Questions ──────────────────────────────────────────

  const showCJK = userProfile === null || userProfile.language === 'en_zh'
  const showFR  = userProfile?.language === 'en_fr'

  const QUESTIONS = [
    {
      id: 'occasion',
      label: showCJK ? 'Occasion / 场合' : showFR ? 'Occasion / Occasion' : 'Occasion',
      options: showCJK
        ? ['Casual / 休闲', 'Party / 聚会', 'Family / 家庭']
        : ['Casual', 'Party', 'Family'],
    },
    {
      id: 'headcount',
      label: showCJK ? 'Headcount / 人数' : showFR ? 'Headcount / Nombre' : 'Headcount',
      options: ['1–2', '3–5', '6+'],
    },
    {
      id: 'sides',
      label: showCJK ? 'Sides needed / 需要配菜' : showFR ? 'Sides needed / Accompagnements' : 'Sides needed',
      options: showCJK ? ['Yes / 是', 'No / 否'] : ['Yes', 'No'],
    },
  ]

  // ── showSecondaryName helper ─────────────────────────────────────────────────

  function showSecondaryName(item: GroceryItem): boolean {
    if (!item.nameSecondary) return false
    if (userProfile?.language === 'en') return false
    return true
  }

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

  // ── Education panel operations ───────────────────────────────────────────────

  function toggleEducationPanel(itemId: string, type: PanelType, itemName: string) {
    // Toggle closed if same panel is already open
    if (openPanel?.itemId === itemId && openPanel?.type === type) {
      setOpenPanel(null)
      return
    }
    // Open from cache immediately (no spinner)
    const cached = panelCache[itemId]?.[type]
    if (cached !== undefined) {
      setOpenPanel({ itemId, type, loading: false })
      return
    }
    // Show loading spinner, then resolve with mock data
    setOpenPanel({ itemId, type, loading: true })
    setTimeout(() => {
      const data = MOCK_EDUCATION[itemId]?.[type] !== undefined
        ? MOCK_EDUCATION[itemId]
        : buildFallbackPanelData(itemName, type)
      setPanelCache(prev => ({ ...prev, [itemId]: { ...prev[itemId], ...data } }))
      setOpenPanel(prev =>
        prev?.itemId === itemId && prev?.type === type ? { ...prev, loading: false } : prev
      )
    }, 600)
  }

  function useAlternative(sectionId: string, itemId: string, nameEn: string, nameSecondary: string) {
    setSections(prev =>
      prev.map(s => s.id !== sectionId ? s : {
        ...s,
        items: s.items.map(i => i.id !== itemId ? i : { ...i, nameEn, nameSecondary }),
      })
    )
    setOpenPanel(null)
  }

  function addAllToSection(sectionId: string, ingredients: RecipeIngredient[]) {
    setSections(prev =>
      prev.map(s => s.id !== sectionId ? s : {
        ...s,
        items: [
          ...s.items,
          ...ingredients.map(ing => ({ id: genId(), nameEn: ing.nameEn, nameSecondary: ing.nameSecondary, quantity: 1, checked: false })),
        ],
      })
    )
  }

  function renderEducationPanel(itemId: string, sectionId: string): ReactNode {
    if (openPanel?.itemId !== itemId) return null
    const { type, loading } = openPanel

    if (loading) {
      return (
        <div data-testid="education-panel-loading" style={{ padding: '10px 14px', color: T.textSec, fontSize: 13 }}>
          Loading…
        </div>
      )
    }

    const cache = panelCache[itemId]

    if (type === 'info' && cache?.info) {
      const info = cache.info
      return (
        <div data-testid="item-info-panel" style={{ padding: '12px 14px', background: T.greenLight, borderRadius: 10, margin: '4px 12px' }}>
          <div data-testid="item-info-taste-profile" style={{ fontSize: 12, marginBottom: 6 }}><strong>Taste:</strong> {info.tasteProfile}</div>
          <div data-testid="item-info-common-uses" style={{ fontSize: 12, marginBottom: 6 }}><strong>Uses:</strong> {info.commonUses}</div>
          <div data-testid="item-info-how-to-pick" style={{ fontSize: 12, marginBottom: 6 }}><strong>How to pick:</strong> {info.howToPick}</div>
          <div data-testid="item-info-storage-tips" style={{ fontSize: 12, marginBottom: 6 }}><strong>Storage:</strong> {info.storageTips}</div>
          <div data-testid="item-info-fun-fact" style={{ fontSize: 12 }}><strong>Fun fact:</strong> {info.funFact}</div>
        </div>
      )
    }

    if (type === 'alternatives' && cache?.alternatives) {
      const { alternatives } = cache.alternatives
      return (
        <div data-testid="alternatives-panel" style={{ padding: '12px 14px', background: T.coralBg, borderRadius: 10, margin: '4px 12px' }}>
          {alternatives.map((alt, i) => (
            <div key={i} data-testid="alternative-item" style={{ marginBottom: 10, padding: '10px 12px', background: '#fff', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span data-testid="alternative-name" style={{ fontSize: 14, fontWeight: 600 }}>{alt.nameEn}</span>
                {alt.nameSecondary && <span style={{ fontSize: 11, color: T.textTer }}>{alt.nameSecondary}</span>}
                <span
                  data-testid="match-level-badge"
                  data-level={alt.matchLevel}
                  style={{
                    marginLeft: 'auto', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 6,
                    background: alt.matchLevel === 'Very close' ? T.greenLight : alt.matchLevel === 'Similar' ? '#FFF8E1' : '#FFF3E0',
                    color: alt.matchLevel === 'Very close' ? T.green : alt.matchLevel === 'Similar' ? '#F57F17' : T.coral,
                  }}
                >
                  {alt.matchLevel}
                </span>
              </div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>{alt.comparison}</div>
              <div style={{ fontSize: 11, color: T.textTer, marginBottom: 8 }}>{alt.aisleHint}</div>
              <button
                data-testid="use-this-button"
                onClick={() => useAlternative(sectionId, itemId, alt.nameEn, alt.nameSecondary)}
                style={{ padding: '5px 14px', background: T.green, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
              >
                Use This
              </button>
            </div>
          ))}
        </div>
      )
    }

    if (type === 'inspire' && cache?.inspire) {
      const { recipes } = cache.inspire
      const allMissing = recipes.flatMap(r => r.missingIngredients)
      return (
        <div data-testid="inspire-panel" style={{ padding: '12px 14px', background: T.greenLight, borderRadius: 10, margin: '4px 12px' }}>
          {recipes.map((recipe, i) => (
            <div key={i} data-testid="inspire-recipe" style={{ marginBottom: 10, padding: '10px 12px', background: '#fff', borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{recipe.name}</div>
              {recipe.nameSecondary && <div style={{ fontSize: 11, color: T.textTer, marginBottom: 4 }}>{recipe.nameSecondary}</div>}
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>{recipe.description}</div>
              {recipe.missingIngredients.map((ing, j) => (
                <div key={j} data-testid="recipe-missing-ingredient" style={{ fontSize: 12, color: T.textTer, marginBottom: 2 }}>
                  {ing.nameEn}
                </div>
              ))}
            </div>
          ))}
          <button
            data-testid="add-all-button"
            onClick={() => addAllToSection(sectionId, allMissing)}
            style={{ marginTop: 4, padding: '7px 18px', background: T.coral, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
          >
            Add All
          </button>
        </div>
      )
    }

    return null
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderFlatItemRow(item: GroceryItem, sectionId: string) {
    return (
      <div key={item.id} style={{ borderBottom: `1px solid ${T.border}` }}>
        <div
          data-testid="grocery-item"
          data-checked={item.checked ? 'true' : 'false'}
          style={{
            display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
            opacity: item.checked ? 0.55 : 1,
          }}
        >
          <div
            data-testid="checkbox-touch-target"
            data-min-height="44"
            style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}
          >
            <RoundCheckbox
              checked={item.checked}
              onChange={() => toggleItem(sectionId, item.id)}
              size={22}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              data-testid={`item-name-en-${item.id}`}
              style={{ fontSize: 14, fontWeight: 500, textDecoration: item.checked ? 'line-through' : 'none' }}
            >
              {item.nameEn}
            </span>
            {showSecondaryName(item) && (
              <span
                data-testid="item-name-secondary"
                style={{ fontSize: 11, color: T.textTer, marginLeft: 6 }}
              >
                {item.nameSecondary}
              </span>
            )}
          </div>
          <TinyBtn
            data-testid={`info-button-${item.id}`}
            onClick={() => toggleEducationPanel(item.id, 'info', item.nameEn)}
            title="Learn about this item"
          ><InfoSvg /></TinyBtn>
          <TinyBtn
            data-testid={`alternatives-button-${item.id}`}
            onClick={() => toggleEducationPanel(item.id, 'alternatives', item.nameEn)}
            title="Alternatives"
          ><SwapSvg /></TinyBtn>
          <div style={{ position: 'relative' }}>
            <button
              data-testid="item-quantity"
              onClick={() => setOpenQtyItemId(openQtyItemId === item.id ? null : item.id)}
              style={{
                background: T.bg, border: 'none', borderRadius: 11, padding: '2px 8px',
                cursor: 'pointer', fontSize: 12, fontWeight: 700, minWidth: 22, height: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
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
                    onClick={() => setItemQty(sectionId, item.id, n)}
                    style={{ width: '33.33%', border: 'none', background: 'none', padding: '7px 0', cursor: 'pointer', fontSize: 14 }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
          <TinyBtn
            data-testid={`inspire-button-${item.id}`}
            onClick={() => toggleEducationPanel(item.id, 'inspire', item.nameEn)}
            title="Recipe ideas"
          ><BulbSvg /></TinyBtn>
          <TinyBtn title="Edit"><EditSvg /></TinyBtn>
          <TinyBtn
            data-testid="delete-item-button"
            onClick={() => deleteItem(sectionId, item.id)}
            title="Delete"
          >
            <TrashIcon size={13} />
          </TinyBtn>
        </div>
        {renderEducationPanel(item.id, sectionId)}
      </div>
    )
  }

  function renderClusterItemRow(item: GroceryItem, sectionId: string) {
    return (
      <div key={item.id} style={{ borderBottom: `1px solid ${T.border}` }}>
        <div
          data-testid="grocery-item"
          data-checked={item.checked ? 'true' : 'false'}
          style={{
            display: 'flex', alignItems: 'center', padding: '4px 12px', gap: 6,
            opacity: item.checked ? 0.55 : 1,
          }}
        >
          <div
            data-testid="checkbox-touch-target"
            data-min-height="44"
            style={{ minHeight: 36, display: 'flex', alignItems: 'center' }}
          >
            <RoundCheckbox
              checked={item.checked}
              onChange={() => toggleItem(sectionId, item.id)}
              size={20}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              data-testid={`item-name-en-${item.id}`}
              style={{ fontSize: 14, fontWeight: 500, textDecoration: item.checked ? 'line-through' : 'none' }}
            >
              {item.nameEn}
            </span>
            {showSecondaryName(item) && (
              <span
                data-testid="item-name-secondary"
                style={{ fontSize: 11, color: T.textTer, marginLeft: 6 }}
              >
                {item.nameSecondary}
              </span>
            )}
          </div>
          <TinyBtn
            data-testid={`info-button-${item.id}`}
            onClick={() => toggleEducationPanel(item.id, 'info', item.nameEn)}
            title="Learn about this item"
          ><InfoSvg /></TinyBtn>
          <TinyBtn
            data-testid={`alternatives-button-${item.id}`}
            onClick={() => toggleEducationPanel(item.id, 'alternatives', item.nameEn)}
            title="Alternatives"
          ><SwapSvg /></TinyBtn>
          <span style={{ fontSize: 11, color: T.textTer, fontWeight: 600 }}>×{item.quantity}</span>
        </div>
        {renderEducationPanel(item.id, sectionId)}
      </div>
    )
  }

  // ── Onboarding handlers ──────────────────────────────────────────────────────

  function handleCreate() {
    setUserProfile({ language: formLanguage, dietary: formDietary, householdSize: formHouseholdSize, tastePrefs: formTastePrefs })
    setAppScreen('list')
  }

  function handleSkip() {
    setAppScreen('list')
  }

  function openEditor() {
    if (userProfile) {
      setFormLanguage(userProfile.language)
      setFormDietary(userProfile.dietary)
      setFormHouseholdSize(userProfile.householdSize)
      setFormTastePrefs(userProfile.tastePrefs)
    }
    setAppScreen('profile-editor')
  }

  // ── ProfileForm ──────────────────────────────────────────────────────────────

  function ProfileForm({ isEditor }: { isEditor: boolean }) {
    const languageOptions: { value: 'en' | 'en_zh' | 'en_fr'; label: string }[] = [
      { value: 'en', label: 'English only' },
      { value: 'en_zh', label: 'English + 简体中文' },
      { value: 'en_fr', label: 'English + Français' },
    ]
    return (
      <div style={{ maxWidth: 390, margin: '0 auto' }}>
        {!isEditor && (
          <h2
            data-testid="onboarding-title"
            style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 20 }}
          >
            Welcome to Smart Grocery
          </h2>
        )}

        {/* Language */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>Language</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {languageOptions.map(opt => {
              const isSelected = formLanguage === opt.value
              return (
                <button
                  key={opt.value}
                  data-testid={`language-option-${opt.value}`}
                  data-selected={isSelected ? 'true' : 'false'}
                  onClick={() => setFormLanguage(opt.value)}
                  style={{
                    padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13,
                    background: isSelected ? T.green : '#fff',
                    color: isSelected ? '#fff' : T.textSec,
                    fontWeight: isSelected ? 600 : 400,
                    boxShadow: isSelected ? 'none' : '0 1px 3px rgba(0,0,0,.08)',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Dietary */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>Dietary preferences</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DIETARY_OPTIONS.map(opt => {
              const isSelected = formDietary.includes(opt.slug)
              return (
                <button
                  key={opt.slug}
                  data-testid={`dietary-chip-${opt.slug}`}
                  data-selected={isSelected ? 'true' : 'false'}
                  onClick={() => setFormDietary(prev =>
                    prev.includes(opt.slug) ? prev.filter(s => s !== opt.slug) : [...prev, opt.slug]
                  )}
                  style={{
                    padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13,
                    background: isSelected ? T.coral : '#fff',
                    color: isSelected ? '#fff' : T.textSec,
                    fontWeight: isSelected ? 600 : 400,
                    boxShadow: isSelected ? 'none' : '0 1px 3px rgba(0,0,0,.08)',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Household size */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>Household size</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([1, 2, 3, 4] as const).map(n => {
              const isSelected = formHouseholdSize === n
              return (
                <button
                  key={n}
                  data-testid={`household-size-${n}`}
                  data-selected={isSelected ? 'true' : 'false'}
                  onClick={() => setFormHouseholdSize(n)}
                  style={{
                    width: 44, height: 44, borderRadius: 22, border: 'none', cursor: 'pointer', fontSize: 14,
                    background: isSelected ? T.green : '#fff',
                    color: isSelected ? '#fff' : T.textSec,
                    fontWeight: isSelected ? 700 : 400,
                    boxShadow: isSelected ? 'none' : '0 1px 3px rgba(0,0,0,.08)',
                  }}
                >
                  {n === 4 ? '4+' : n}
                </button>
              )
            })}
          </div>
        </div>

        {/* Taste prefs */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>Taste preferences</div>
          <input
            data-testid="taste-prefs-input"
            value={formTastePrefs}
            onChange={e => setFormTastePrefs(e.target.value)}
            placeholder="e.g. spicy, low-sodium, nut-free…"
            style={{
              width: '100%', border: `1px solid ${T.border}`, borderRadius: 10,
              padding: '10px 14px', fontSize: 14, boxSizing: 'border-box',
              background: '#fff', color: T.text,
            }}
          />
        </div>

        {/* Actions */}
        <button
          data-testid="onboarding-create-button"
          onClick={handleCreate}
          style={{
            width: '100%', padding: '13px 0', background: T.green, color: '#fff',
            border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10,
          }}
        >
          {isEditor ? 'Save Profile' : 'Create Profile'}
        </button>

        {!isEditor && (
          <button
            data-testid="onboarding-skip-button"
            onClick={handleSkip}
            style={{
              width: '100%', padding: '11px 0', background: 'transparent', color: T.textSec,
              border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 14, cursor: 'pointer',
            }}
          >
            Skip for now
          </button>
        )}
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: T.bg, minHeight: '100vh', maxWidth: 390, margin: '0 auto', fontFamily: T.font }}>

      {appScreen === 'onboarding' && (
        <div data-testid="onboarding-screen" style={{ padding: 24 }}>
          {ProfileForm({ isEditor: false })}
        </div>
      )}

      {appScreen === 'profile-editor' && (
        <div data-testid="profile-editor-screen" style={{ padding: 24 }}>
          {ProfileForm({ isEditor: true })}
        </div>
      )}

      {appScreen === 'list' && (
        <>
          {/* App header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 8px' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-.3px' }}>
              Smart Grocery
            </h1>
            {userProfile && (
              <button
                data-testid="profile-gear-button"
                onClick={openEditor}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: T.textSec, padding: 4 }}
              >
                ⚙
              </button>
            )}
            <button
              data-testid="add-section-button"
              onClick={addSection}
              style={{ background: T.green, color: 'white', border: 'none', borderRadius: 20, width: 32, height: 32, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
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

        const allAnswered = QUESTIONS.every(q => selectedChips[q.id])

        return (
          <div
            key={section.id}
            data-testid="section-card"
            style={{
              margin: '8px 16px', background: T.card,
              borderRadius: 16, boxShadow: T.shadow,
            }}
          >
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 6 }}>
              <button
                data-testid="section-collapse-toggle"
                data-collapsed={section.collapsed ? 'true' : 'false'}
                onClick={() => toggleCollapse(section.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: T.green, display: 'flex', alignItems: 'center',
                }}
              >
                <ChevDownIcon
                  size={16}
                  style={{
                    transform: section.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                />
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
                  style={{ flex: 1, fontSize: 15, fontWeight: 600, border: `1px solid ${T.green}`, borderRadius: 6, padding: '2px 8px' }}
                />
              ) : (
                <span
                  onClick={() => startEditSection(section)}
                  style={{ flex: 1, fontSize: 15, fontWeight: 700, color: T.text, cursor: 'pointer' }}
                >
                  {section.name}
                </span>
              )}

              <span style={{ fontSize: 12, color: T.textTer, fontWeight: 500 }}>
                {section.items.length}
              </span>

              <button
                data-testid="suggest-button"
                onClick={() => openQuestions(section.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 14px', borderRadius: 20,
                  background: T.coralBg, color: T.coral, border: 'none',
                  fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
                }}
              >
                <SparklesIcon size={13} />
                Suggest
              </button>

              <TinyBtn
                data-testid="delete-section-button"
                onClick={() => deleteSection(section.id)}
                title="Delete section"
              >
                <TrashIcon size={14} />
              </TinyBtn>
            </div>

            {/* Quick Questions panel */}
            {suggestPhase === 'questioning' && (
              <div
                data-testid="quick-questions-panel"
                style={{
                  margin: '0 16px 12px',
                  padding: 16,
                  background: T.coralBg,
                  borderRadius: T.radius,
                  borderLeft: `4px solid ${T.coral}`,
                }}
              >
                {/* Panel header with Skip */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.coral }}>
                    ✨ Quick questions for better suggestions
                  </div>
                  <button
                    data-testid="skip-suggest-button"
                    onClick={() => triggerSuggest(section.id)}
                    style={{ fontSize: 11, color: T.textTer, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Skip →
                  </button>
                </div>

                {QUESTIONS.map(q => (
                  <div key={q.id} data-testid="question-chip-group" style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: T.text }}>{q.label}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {q.options.map((opt, idx) => {
                        const isSelected = selectedChips[q.id] === opt
                        return (
                          <button
                            key={idx}
                            data-testid={`chip-option-${q.id}-${idx}`}
                            data-selected={isSelected ? 'true' : 'false'}
                            onClick={() => selectChip(section.id, q.id, opt)}
                            style={{
                              padding: '7px 14px', borderRadius: 20, border: 'none',
                              background: isSelected ? T.coral : '#fff',
                              color: isSelected ? '#fff' : T.textSec,
                              fontWeight: isSelected ? 600 : 400,
                              boxShadow: isSelected ? 'none' : '0 1px 3px rgba(0,0,0,.06)',
                              fontSize: 12, cursor: 'pointer',
                            }}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <button
                  data-testid="get-suggestions-button"
                  onClick={() => triggerSuggest(section.id)}
                  style={{
                    width: '100%', marginTop: 14, padding: '11px 0',
                    borderRadius: T.radiusSm, border: 'none',
                    background: allAnswered ? T.green : '#C0C0C0',
                    color: '#fff',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Get Suggestions →
                </button>
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
                <div style={{ margin: '0 16px 8px', display: 'flex', background: T.bg, borderRadius: T.radiusSm, padding: 3 }}>
                  {(['flat', 'smart', 'aisles'] as ActiveView[]).map(view => {
                    const isActive = activeView === view
                    const labels: Record<ActiveView, string> = { flat: '📝 Flat', smart: '✨ Smart', aisles: '🏪 Aisles' }
                    const testIds: Record<ActiveView, string> = { flat: 'view-tab-flat', smart: 'view-tab-smart', aisles: 'view-tab-aisles' }
                    return (
                      <button
                        key={view}
                        data-testid={testIds[view]}
                        onClick={() => setView(section.id, view)}
                        style={{
                          flex: 1, padding: '7px 0', borderRadius: 8, border: 'none',
                          background: isActive ? T.card : 'transparent',
                          color: isActive ? T.text : T.textTer,
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          boxShadow: isActive ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                          transition: 'all .2s ease',
                        }}
                      >
                        {labels[view]}
                      </button>
                    )
                  })}
                </div>

                {/* Flat view */}
                {activeView === 'flat' && (
                  <div data-testid="flat-view">
                    {section.items.map(item => renderFlatItemRow(item, section.id))}
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
                          style={{ width: '100%', border: `1px solid ${T.green}`, borderRadius: 6, padding: '6px 10px', fontSize: 14, boxSizing: 'border-box' }}
                        />
                      </div>
                    ) : (
                      <button
                        data-testid="add-item-button"
                        data-min-height="44"
                        onClick={() => { setAddingItemSectionId(section.id); setAddingItemText('') }}
                        style={{ width: '100%', minHeight: 44, background: 'none', border: 'none', textAlign: 'left', padding: '8px 12px 12px', color: T.green, fontSize: 14, cursor: 'pointer' }}
                      >
                        + Add Item
                      </button>
                    )}
                  </div>
                )}

                {/* Smart view */}
                {activeView === 'smart' && suggestResult && (
                  <div data-testid="smart-view" style={{ padding: '8px 16px' }}>
                    {/* Context block + Keep All */}
                    <div style={{ display: 'flex', gap: 8, margin: '0 0 10px', alignItems: 'stretch' }}>
                      <div
                        data-testid="context-block"
                        style={{
                          flex: 1, padding: '10px 12px', background: T.coralBg,
                          borderRadius: T.radiusSm, borderLeft: `3px solid ${T.coral}`,
                        }}
                      >
                        <span style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>
                          {suggestResult.contextSummary}
                        </span>
                      </div>
                      <button
                        data-testid="keep-all-button"
                        onClick={() => keepAll(section.id)}
                        style={{
                          padding: '8px 14px', borderRadius: T.radiusSm,
                          background: T.green, color: '#fff', border: 'none',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          whiteSpace: 'nowrap', display: 'flex', alignItems: 'center',
                          gap: 4, flexShrink: 0,
                        }}
                      >
                        <CheckIcon size={14} />
                        Keep All
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
                          style={{
                            margin: '0 0 10px',
                            padding: 16,
                            background: T.card,
                            borderRadius: T.radius,
                            boxShadow: T.shadow,
                            borderLeft: `4px solid ${T.coral}`,
                          }}
                        >
                          {/* Cluster header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <span style={{ fontSize: 22 }}>{cluster.emoji}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{cluster.name}</div>
                              <div
                                data-testid="cluster-description"
                                style={{ fontSize: 12, color: T.textTer }}
                              >
                                {cluster.description}
                              </div>
                            </div>
                          </div>

                          {/* Existing items */}
                          {clusterItems.map(item => renderClusterItemRow(item, section.id))}

                          {/* Suggestion items */}
                          {clusterSuggs.map(sugg => (
                            <div
                              key={sugg.id}
                              data-testid="suggestion-item"
                              style={{
                                display: 'flex', alignItems: 'center', padding: '8px 4px',
                                gap: 6, background: T.coralBg, borderRadius: T.radiusSm,
                                marginBottom: 4,
                              }}
                            >
                              {/* Sparkle indicator */}
                              <div style={{
                                width: 20, height: 20, borderRadius: '50%',
                                background: T.coralLight,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                <SparklesIcon size={10} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 14 }}>{sugg.nameEn}</span>
                                <span style={{ fontSize: 11, color: T.textTer, marginLeft: 6 }}>{sugg.nameSecondary}</span>
                                <div
                                  data-testid="suggestion-reason"
                                  style={{ fontSize: 11, color: T.textTer, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}
                                >
                                  {sugg.reason}
                                </div>
                              </div>
                              <TinyBtn title="Learn about this item"><InfoSvg /></TinyBtn>
                              <button
                                data-testid="keep-button"
                                onClick={() => keepSuggestion(section.id, sugg.id)}
                                style={{
                                  padding: '4px 10px', background: T.green, color: 'white',
                                  border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                                }}
                              >
                                Keep
                              </button>
                              <TinyBtn
                                data-testid="dismiss-button"
                                onClick={() => dismissSuggestion(section.id, sugg.id)}
                                title="Dismiss"
                              >
                                <XIcon size={13} />
                              </TinyBtn>
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
                        style={{ marginBottom: 8, background: 'none', border: `1px solid ${T.coral}`, borderRadius: 8, padding: '6px 16px', fontSize: 13, color: T.coral, cursor: 'pointer' }}
                      >
                        More
                      </button>
                    )}
                  </div>
                )}

                {/* Aisles view */}
                {activeView === 'aisles' && suggestResult && (
                  <div data-testid="aisles-view" style={{ padding: '8px 16px' }}>
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
                            style={{
                              margin: '0 0 8px',
                              padding: 14,
                              background: T.card,
                              borderRadius: T.radius,
                              boxShadow: T.shadow,
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.green, marginBottom: 6 }}>
                              {aisle.name}
                            </div>
                            {aisleItems.map(item => renderClusterItemRow(item, section.id))}
                            {aisleSuggs.map(sugg => (
                              <div
                                key={sugg.id}
                                data-testid="suggestion-item"
                                style={{ display: 'flex', alignItems: 'center', padding: '6px 4px', gap: 6 }}
                              >
                                <div style={{ flex: 1 }}>
                                  <span style={{ fontSize: 14 }}>{sugg.nameEn}</span>
                                  {sugg.nameSecondary && (
                                    <span style={{ fontSize: 11, color: T.textTer, marginLeft: 6 }}>{sugg.nameSecondary}</span>
                                  )}
                                </div>
                                <span
                                  data-testid="new-badge"
                                  style={{
                                    background: T.coralBg, color: T.coral,
                                    borderRadius: 6, padding: '2px 7px',
                                    fontSize: 10, fontWeight: 600,
                                  }}
                                >
                                  NEW
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    <button
                      data-testid="add-item-button"
                      onClick={() => { setAddingItemSectionId(section.id); setAddingItemText('') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '10px 0', background: 'none', border: 'none',
                        cursor: 'pointer', color: T.green, fontSize: 13, fontWeight: 500,
                      }}
                    >
                      + Add Item
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Idle state: Phase 1A rendering (items + add button) */}
            {suggestPhase === 'idle' && !section.collapsed && (
              <>
                {section.items.map(item => renderFlatItemRow(item, section.id))}

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
                      style={{ width: '100%', border: `1px solid ${T.green}`, borderRadius: 6, padding: '6px 10px', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                ) : (
                  <button
                    data-testid="add-item-button"
                    data-min-height="44"
                    onClick={() => { setAddingItemSectionId(section.id); setAddingItemText('') }}
                    style={{ width: '100%', minHeight: 44, background: 'none', border: 'none', textAlign: 'left', padding: '8px 12px 12px', color: T.green, fontSize: 14, cursor: 'pointer' }}
                  >
                    + Add Item
                  </button>
                )}
              </>
            )}
          </div>
        )
          })}
        </>
      )}
    </div>
  )
}
