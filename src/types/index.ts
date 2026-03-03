export interface GroceryItem {
  id: string
  nameEn: string
  nameSecondary: string
  quantity: number
  checked: boolean
}

export type SuggestPhase = 'idle' | 'questioning' | 'loading' | 'done'
export type ActiveView = 'flat' | 'smart' | 'aisles'

export interface SuggestionEntry {
  id: string; nameEn: string; nameSecondary: string
  reason: string; clusterId: string; isExtra: boolean
}
export interface ClusterDef {
  id: string; emoji: string; name: string; description: string
  existingItemIds: string[]; suggestionIds: string[]
}
export interface AisleGroupDef {
  id: string; name: string
  existingItemIds: string[]; suggestionIds: string[]
}
export interface SuggestResult {
  contextSummary: string
  clusters: ClusterDef[]
  aisleGroups: AisleGroupDef[]
  suggestions: SuggestionEntry[]
}

export type PanelType = 'info' | 'alternatives' | 'inspire'

export interface ItemInfoData {
  tasteProfile: string
  commonUses: string
  howToPick: string
  storageTips: string
  funFact: string
}

export interface AlternativeItem {
  nameEn: string
  nameSecondary: string
  matchLevel: 'Very close' | 'Similar' | 'Different but works'
  comparison: string
  aisleHint: string
}

export interface RecipeIngredient { nameEn: string; nameSecondary: string }

export interface RecipeItem {
  name: string
  nameSecondary: string
  description: string
  missingIngredients: RecipeIngredient[]
}

export interface ItemPanelCache {
  info?: ItemInfoData
  alternatives?: { alternatives: AlternativeItem[] }
  inspire?: { recipes: RecipeItem[] }
}

export interface Section {
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

export interface UserProfile {
  language: 'en' | 'en_zh' | 'en_fr'
  dietary: string[]
  householdSize: number
  tastePrefs: string
}

export type AppScreen = 'onboarding' | 'list' | 'profile-editor'

export const DIETARY_OPTIONS = [
  { slug: 'vegetarian', label: 'Vegetarian' },
  { slug: 'vegan', label: 'Vegan' },
  { slug: 'gluten-free', label: 'Gluten-Free' },
  { slug: 'halal', label: 'Halal' },
  { slug: 'dairy-free', label: 'Dairy-Free' },
]
