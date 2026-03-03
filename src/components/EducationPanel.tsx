import type { ReactNode } from 'react'
import type { PanelType, ItemPanelCache, RecipeIngredient } from '../types'
import { T } from '../constants/tokens'

interface EducationPanelProps {
  itemId: string
  sectionId: string
  openPanel: { itemId: string; type: PanelType; loading: boolean } | null
  panelCache: Record<string, ItemPanelCache>
  onUseAlternative: (sectionId: string, itemId: string, nameEn: string, nameSecondary: string) => void
  onAddAllToSection: (sectionId: string, ingredients: RecipeIngredient[]) => void
}

export function EducationPanel({ itemId, sectionId, openPanel, panelCache, onUseAlternative, onAddAllToSection }: EducationPanelProps): ReactNode {
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
              onClick={() => onUseAlternative(sectionId, itemId, alt.nameEn, alt.nameSecondary)}
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
          onClick={() => onAddAllToSection(sectionId, allMissing)}
          style={{ marginTop: 4, padding: '7px 18px', background: T.coral, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
        >
          Add All
        </button>
      </div>
    )
  }

  return null
}
