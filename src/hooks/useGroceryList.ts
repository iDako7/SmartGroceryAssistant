import { useState } from 'react'
import type { GroceryItem, ActiveView, Section } from '../types'
import { BBQ_SUGGEST_RESULT } from '../mock/bbq-suggest'
import { INITIAL_SECTIONS, genId } from '../mock/initial-sections'
import { fetchSuggest } from '../services/suggest-service'

export function useGroceryList(onError: (msg: string) => void) {
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState('')
  const [addingItemSectionId, setAddingItemSectionId] = useState<string | null>(null)
  const [addingItemText, setAddingItemText] = useState('')
  const [openQtyItemId, setOpenQtyItemId] = useState<string | null>(null)

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

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    if (apiKey) {
      const section = sections.find(s => s.id === sectionId)
      if (!section) return
      fetchSuggest(section)
        .then(result => {
          setSections(prev =>
            prev.map(s => s.id !== sectionId ? s : {
              ...s,
              suggestPhase: 'done',
              suggestResult: result,
              activeView: 'smart',
            })
          )
        })
        .catch(() => {
          setSections(prev =>
            prev.map(s => s.id !== sectionId ? s : { ...s, suggestPhase: 'idle' })
          )
          onError('Something went wrong. Please try again.')
        })
    } else {
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

  return {
    sections, setSections,
    editingSectionId, setEditingSectionId, editingSectionName, setEditingSectionName,
    addingItemSectionId, setAddingItemSectionId, addingItemText, setAddingItemText,
    openQtyItemId, setOpenQtyItemId,
    addSection, startEditSection, commitSectionName, deleteSection, toggleCollapse,
    toggleItem, setItemQty, deleteItem, commitAddItem,
    openQuestions, selectChip, triggerSuggest,
    keepSuggestion, dismissSuggestion, keepAll, showMore, setView,
  }
}
