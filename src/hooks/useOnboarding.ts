import { useState } from 'react'
import type { GroceryItem, UserProfile, AppScreen } from '../types'

export function useOnboarding() {
  const [appScreen, setAppScreen] = useState<AppScreen>('onboarding')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [formLanguage, setFormLanguage] = useState<'en' | 'en_zh' | 'en_fr'>('en_zh')
  const [formDietary, setFormDietary] = useState<string[]>([])
  const [formHouseholdSize, setFormHouseholdSize] = useState<number>(2)
  const [formTastePrefs, setFormTastePrefs] = useState<string>('')

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

  function showSecondaryName(item: GroceryItem): boolean {
    if (!item.nameSecondary) return false
    if (userProfile?.language === 'en') return false
    return true
  }

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

  return {
    appScreen, userProfile,
    formLanguage, setFormLanguage,
    formDietary, setFormDietary,
    formHouseholdSize, setFormHouseholdSize,
    formTastePrefs, setFormTastePrefs,
    QUESTIONS, showSecondaryName,
    handleCreate, handleSkip, openEditor,
  }
}
