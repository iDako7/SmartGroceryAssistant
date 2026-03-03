import type { ReactNode } from 'react'
import type { GroceryItem, PanelType, ItemPanelCache, RecipeIngredient } from '../types'
import { T } from '../constants/tokens'
import { InfoSvg, SwapSvg } from './Icons'
import { RoundCheckbox } from './RoundCheckbox'
import { TinyBtn } from './TinyBtn'
import { EducationPanel } from './EducationPanel'

interface ClusterItemRowProps {
  item: GroceryItem
  sectionId: string
  showSecondary: boolean
  openPanel: { itemId: string; type: PanelType; loading: boolean } | null
  panelCache: Record<string, ItemPanelCache>
  onToggleItem: (sectionId: string, itemId: string) => void
  onToggleEducationPanel: (itemId: string, type: PanelType, itemName: string) => void
  onUseAlternative: (sectionId: string, itemId: string, nameEn: string, nameSecondary: string) => void
  onAddAllToSection: (sectionId: string, ingredients: RecipeIngredient[]) => void
}

export function ClusterItemRow({
  item, sectionId, showSecondary, openPanel, panelCache,
  onToggleItem, onToggleEducationPanel, onUseAlternative, onAddAllToSection,
}: ClusterItemRowProps): ReactNode {
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
            onChange={() => onToggleItem(sectionId, item.id)}
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
          {showSecondary && (
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
          onClick={() => onToggleEducationPanel(item.id, 'info', item.nameEn)}
          title="Learn about this item"
        ><InfoSvg /></TinyBtn>
        <TinyBtn
          data-testid={`alternatives-button-${item.id}`}
          onClick={() => onToggleEducationPanel(item.id, 'alternatives', item.nameEn)}
          title="Alternatives"
        ><SwapSvg /></TinyBtn>
        <span style={{ fontSize: 11, color: T.textTer, fontWeight: 600 }}>×{item.quantity}</span>
      </div>
      <EducationPanel
        itemId={item.id}
        sectionId={sectionId}
        openPanel={openPanel}
        panelCache={panelCache}
        onUseAlternative={onUseAlternative}
        onAddAllToSection={onAddAllToSection}
      />
    </div>
  )
}
