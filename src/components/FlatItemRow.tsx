import type { ReactNode } from 'react'
import type { GroceryItem, PanelType, ItemPanelCache, RecipeIngredient } from '../types'
import { T } from '../constants/tokens'
import { InfoSvg, SwapSvg, BulbSvg, EditSvg, TrashIcon } from './Icons'
import { RoundCheckbox } from './RoundCheckbox'
import { TinyBtn } from './TinyBtn'
import { EducationPanel } from './EducationPanel'

interface FlatItemRowProps {
  item: GroceryItem
  sectionId: string
  showSecondary: boolean
  openQtyItemId: string | null
  openPanel: { itemId: string; type: PanelType; loading: boolean } | null
  panelCache: Record<string, ItemPanelCache>
  onToggleItem: (sectionId: string, itemId: string) => void
  onToggleEducationPanel: (itemId: string, type: PanelType, itemName: string) => void
  onSetOpenQtyItemId: (id: string | null) => void
  onSetItemQty: (sectionId: string, itemId: string, qty: number) => void
  onDeleteItem: (sectionId: string, itemId: string) => void
  onUseAlternative: (sectionId: string, itemId: string, nameEn: string, nameSecondary: string) => void
  onAddAllToSection: (sectionId: string, ingredients: RecipeIngredient[]) => void
}

export function FlatItemRow({
  item, sectionId, showSecondary, openQtyItemId, openPanel, panelCache,
  onToggleItem, onToggleEducationPanel, onSetOpenQtyItemId, onSetItemQty,
  onDeleteItem, onUseAlternative, onAddAllToSection,
}: FlatItemRowProps): ReactNode {
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
            onChange={() => onToggleItem(sectionId, item.id)}
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
        <div style={{ position: 'relative' }}>
          <button
            data-testid="item-quantity"
            onClick={() => onSetOpenQtyItemId(openQtyItemId === item.id ? null : item.id)}
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
                  onClick={() => onSetItemQty(sectionId, item.id, n)}
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
          onClick={() => onToggleEducationPanel(item.id, 'inspire', item.nameEn)}
          title="Recipe ideas"
        ><BulbSvg /></TinyBtn>
        <TinyBtn title="Edit"><EditSvg /></TinyBtn>
        <TinyBtn
          data-testid="delete-item-button"
          onClick={() => onDeleteItem(sectionId, item.id)}
          title="Delete"
        >
          <TrashIcon size={13} />
        </TinyBtn>
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
