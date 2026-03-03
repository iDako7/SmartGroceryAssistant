import { callOpenRouter } from './openrouter'
import type { Section, SuggestResult, SuggestionEntry, ClusterDef, AisleGroupDef } from '../types'
import { genId } from '../mock/initial-sections'

export async function fetchSuggest(section: Section): Promise<SuggestResult> {
  const itemNames = section.items.map(i => i.nameEn).join(', ')

  const messages = [
    {
      role: 'user' as const,
      content: `You are a grocery assistant. Given the grocery list "${section.name}" containing: ${itemNames}. Suggest recipe-clustered additions. Return ONLY valid JSON with this structure:
{"contextSummary":"brief context","clusters":[{"id":"c1","emoji":"🍖","name":"Cluster Name","description":"desc","items":[{"nameEn":"ExistingItem","nameSecondary":"","existing":true},{"nameEn":"NewItem","nameSecondary":"","existing":false,"reason":"why","quantity":1}]}],"ungrouped":{"items":[]},"aisleLayout":[{"emoji":"🥩","aisleName":"Meat & Seafood","items":[{"nameEn":"Item","nameSecondary":"","quantity":1,"checked":false,"isSuggestion":false}]}],"moreSuggestions":[]}`,
    },
  ]

  const apiResponse = await callOpenRouter(messages)
  return parseApiSuggestResponse(apiResponse as Record<string, unknown>, section)
}

function parseApiSuggestResponse(
  apiResponse: Record<string, unknown>,
  section: Section
): SuggestResult {
  const suggestions: SuggestionEntry[] = []
  const clusters: ClusterDef[] = []

  const rawClusters = (apiResponse.clusters as Array<Record<string, unknown>>) ?? []
  for (const cluster of rawClusters) {
    const existingItemIds: string[] = []
    const suggestionIds: string[] = []
    const items = (cluster.items as Array<Record<string, unknown>>) ?? []

    for (const item of items) {
      if (item.existing) {
        const found = section.items.find(i => i.nameEn === item.nameEn)
        if (found) existingItemIds.push(found.id)
      } else {
        const sugg: SuggestionEntry = {
          id: genId(),
          nameEn: item.nameEn as string,
          nameSecondary: (item.nameSecondary as string) ?? '',
          reason: (item.reason as string) ?? '',
          clusterId: cluster.id as string,
          isExtra: false,
        }
        suggestions.push(sugg)
        suggestionIds.push(sugg.id)
      }
    }

    clusters.push({
      id: cluster.id as string,
      emoji: cluster.emoji as string,
      name: cluster.name as string,
      description: cluster.description as string,
      existingItemIds,
      suggestionIds,
    })
  }

  // moreSuggestions → isExtra: true
  const rawMore = (apiResponse.moreSuggestions as Array<Record<string, unknown>>) ?? []
  for (const item of rawMore) {
    suggestions.push({
      id: genId(),
      nameEn: item.nameEn as string,
      nameSecondary: (item.nameSecondary as string) ?? '',
      reason: (item.reason as string) ?? '',
      clusterId: (item.clusterId as string) ?? '',
      isExtra: true,
    })
  }

  // aisleLayout → AisleGroupDef[]
  const aisleGroups: AisleGroupDef[] = []
  const rawAisles = (apiResponse.aisleLayout as Array<Record<string, unknown>>) ?? []
  for (const aisle of rawAisles) {
    const existingItemIds: string[] = []
    const suggestionIds: string[] = []
    const items = (aisle.items as Array<Record<string, unknown>>) ?? []

    for (const item of items) {
      if (!item.isSuggestion) {
        const found = section.items.find(i => i.nameEn === item.nameEn)
        if (found) existingItemIds.push(found.id)
      } else {
        const found = suggestions.find(s => s.nameEn === item.nameEn)
        if (found) suggestionIds.push(found.id)
      }
    }

    aisleGroups.push({
      id: genId(),
      name: `${aisle.emoji} ${aisle.aisleName}`,
      existingItemIds,
      suggestionIds,
    })
  }

  return {
    contextSummary: (apiResponse.contextSummary as string) ?? '',
    clusters,
    aisleGroups,
    suggestions,
  }
}
