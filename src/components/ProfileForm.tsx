import React from 'react'
import { DIETARY_OPTIONS } from '../types'
import { T } from '../constants/tokens'

interface ProfileFormProps {
  isEditor: boolean
  formLanguage: 'en' | 'en_zh' | 'en_fr'
  formDietary: string[]
  formHouseholdSize: number
  formTastePrefs: string
  onSetFormLanguage: (lang: 'en' | 'en_zh' | 'en_fr') => void
  onSetFormDietary: React.Dispatch<React.SetStateAction<string[]>>
  onSetFormHouseholdSize: (size: number) => void
  onSetFormTastePrefs: (prefs: string) => void
  onHandleCreate: () => void
  onHandleSkip: () => void
}

export function ProfileForm({
  isEditor, formLanguage, formDietary, formHouseholdSize, formTastePrefs,
  onSetFormLanguage, onSetFormDietary, onSetFormHouseholdSize, onSetFormTastePrefs,
  onHandleCreate, onHandleSkip,
}: ProfileFormProps) {
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
                onClick={() => onSetFormLanguage(opt.value)}
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
                onClick={() => onSetFormDietary(prev =>
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
                onClick={() => onSetFormHouseholdSize(n)}
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
          onChange={e => onSetFormTastePrefs(e.target.value)}
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
        onClick={onHandleCreate}
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
          onClick={onHandleSkip}
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
