import { useState } from 'react'
import type { PanelType, ItemPanelCache, RecipeIngredient, Section } from '../types'
import { MOCK_EDUCATION, buildFallbackPanelData } from '../mock/education'
import { genId } from '../mock/initial-sections'
import { fetchItemInfo, fetchAlternatives, fetchInspire } from '../services/education-service'

export function useEducationPanel(
  setSections: React.Dispatch<React.SetStateAction<Section[]>>,
  onError: (msg: string) => void
) {
  const [openPanel, setOpenPanel] = useState<{ itemId: string; type: PanelType; loading: boolean } | null>(null)
  const [panelCache, setPanelCache] = useState<Record<string, ItemPanelCache>>({})

  function toggleEducationPanel(itemId: string, type: PanelType, itemName: string) {
    if (openPanel?.itemId === itemId && openPanel?.type === type) {
      setOpenPanel(null)
      return
    }
    const cached = panelCache[itemId]?.[type]
    if (cached !== undefined) {
      setOpenPanel({ itemId, type, loading: false })
      return
    }
    setOpenPanel({ itemId, type, loading: true })

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    if (apiKey) {
      let promise: Promise<void>
      if (type === 'info') {
        promise = fetchItemInfo(itemName).then(data => {
          setPanelCache(prev => ({ ...prev, [itemId]: { ...prev[itemId], info: data } }))
          setOpenPanel(prev =>
            prev?.itemId === itemId && prev?.type === type ? { ...prev, loading: false } : prev
          )
        })
      } else if (type === 'alternatives') {
        promise = fetchAlternatives(itemName).then(data => {
          setPanelCache(prev => ({ ...prev, [itemId]: { ...prev[itemId], alternatives: data } }))
          setOpenPanel(prev =>
            prev?.itemId === itemId && prev?.type === type ? { ...prev, loading: false } : prev
          )
        })
      } else {
        promise = fetchInspire(itemName).then(data => {
          setPanelCache(prev => ({ ...prev, [itemId]: { ...prev[itemId], inspire: data } }))
          setOpenPanel(prev =>
            prev?.itemId === itemId && prev?.type === type ? { ...prev, loading: false } : prev
          )
        })
      }
      promise.catch(() => {
        setOpenPanel(null)
        onError('Something went wrong. Please try again.')
      })
    } else {
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

  return {
    openPanel, panelCache,
    toggleEducationPanel, useAlternative, addAllToSection,
  }
}
