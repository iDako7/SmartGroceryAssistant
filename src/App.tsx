import { useState } from 'react'
import type { GroceryItem, ActiveView, SuggestionEntry } from './types'
import { T } from './constants/tokens'
import { ChevDownIcon, TrashIcon, SparklesIcon, CheckIcon, XIcon, InfoSvg } from './components/Icons'
import { TinyBtn } from './components/TinyBtn'
import { FlatItemRow } from './components/FlatItemRow'
import { ClusterItemRow } from './components/ClusterItemRow'
import { ProfileForm } from './components/ProfileForm'
import { useGroceryList } from './hooks/useGroceryList'
import { useEducationPanel } from './hooks/useEducationPanel'
import { useOnboarding } from './hooks/useOnboarding'

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const grocery = useGroceryList(msg => setErrorMessage(msg))
  const {
    sections, setSections,
    editingSectionId, setEditingSectionId, editingSectionName, setEditingSectionName,
    addingItemSectionId, setAddingItemSectionId, addingItemText, setAddingItemText,
    openQtyItemId, setOpenQtyItemId,
    addSection, startEditSection, commitSectionName, deleteSection, toggleCollapse,
    toggleItem, setItemQty, deleteItem, commitAddItem,
    openQuestions, selectChip, triggerSuggest,
    keepSuggestion, dismissSuggestion, keepAll, showMore, setView,
  } = grocery

  const { openPanel, panelCache, toggleEducationPanel, useAlternative, addAllToSection } = useEducationPanel(setSections, msg => setErrorMessage(msg))

  const {
    appScreen, userProfile,
    formLanguage, setFormLanguage,
    formDietary, setFormDietary,
    formHouseholdSize, setFormHouseholdSize,
    formTastePrefs, setFormTastePrefs,
    QUESTIONS, showSecondaryName,
    handleCreate, handleSkip, openEditor,
  } = useOnboarding()

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderFlatItemRow(item: GroceryItem, sectionId: string) {
    return (
      <FlatItemRow
        key={item.id}
        item={item}
        sectionId={sectionId}
        showSecondary={showSecondaryName(item)}
        openQtyItemId={openQtyItemId}
        openPanel={openPanel}
        panelCache={panelCache}
        onToggleItem={toggleItem}
        onToggleEducationPanel={toggleEducationPanel}
        onSetOpenQtyItemId={setOpenQtyItemId}
        onSetItemQty={setItemQty}
        onDeleteItem={deleteItem}
        onUseAlternative={useAlternative}
        onAddAllToSection={addAllToSection}
      />
    )
  }

  function renderClusterItemRow(item: GroceryItem, sectionId: string) {
    return (
      <ClusterItemRow
        key={item.id}
        item={item}
        sectionId={sectionId}
        showSecondary={showSecondaryName(item)}
        openPanel={openPanel}
        panelCache={panelCache}
        onToggleItem={toggleItem}
        onToggleEducationPanel={toggleEducationPanel}
        onUseAlternative={useAlternative}
        onAddAllToSection={addAllToSection}
      />
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: T.bg, minHeight: '100vh', maxWidth: 390, margin: '0 auto', fontFamily: T.font }}>

      {errorMessage && (
        <div
          data-testid="error-toast"
          style={{
            position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: '#fff', border: '1px solid #f44336', borderRadius: 10,
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 2px 12px rgba(0,0,0,.12)', zIndex: 100, maxWidth: 340,
          }}
        >
          <span style={{ fontSize: 13, color: '#c62828', flex: 1 }}>{errorMessage}</span>
          <button
            data-testid="toast-dismiss"
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#999', padding: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {appScreen === 'onboarding' && (
        <div data-testid="onboarding-screen" style={{ padding: 24 }}>
          <ProfileForm
            isEditor={false}
            formLanguage={formLanguage}
            formDietary={formDietary}
            formHouseholdSize={formHouseholdSize}
            formTastePrefs={formTastePrefs}
            onSetFormLanguage={setFormLanguage}
            onSetFormDietary={setFormDietary}
            onSetFormHouseholdSize={setFormHouseholdSize}
            onSetFormTastePrefs={setFormTastePrefs}
            onHandleCreate={handleCreate}
            onHandleSkip={handleSkip}
          />
        </div>
      )}

      {appScreen === 'profile-editor' && (
        <div data-testid="profile-editor-screen" style={{ padding: 24 }}>
          <ProfileForm
            isEditor={true}
            formLanguage={formLanguage}
            formDietary={formDietary}
            formHouseholdSize={formHouseholdSize}
            formTastePrefs={formTastePrefs}
            onSetFormLanguage={setFormLanguage}
            onSetFormDietary={setFormDietary}
            onSetFormHouseholdSize={setFormHouseholdSize}
            onSetFormTastePrefs={setFormTastePrefs}
            onHandleCreate={handleCreate}
            onHandleSkip={handleSkip}
          />
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
