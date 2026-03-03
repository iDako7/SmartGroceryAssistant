import { callOpenRouter } from './openrouter'
import type { ItemInfoData, AlternativeItem, RecipeItem } from '../types'

export async function fetchItemInfo(itemName: string): Promise<ItemInfoData> {
  const messages = [
    {
      role: 'user' as const,
      content: `Provide grocery item info for "${itemName}". Return ONLY valid JSON:
{"tasteProfile":"...","commonUses":"...","howToPick":"...","storageTips":"...","funFact":"..."}`,
    },
  ]
  return callOpenRouter(messages) as Promise<ItemInfoData>
}

export async function fetchAlternatives(
  itemName: string
): Promise<{ alternatives: AlternativeItem[] }> {
  const messages = [
    {
      role: 'user' as const,
      content: `Provide 3 grocery alternatives for "${itemName}". Return ONLY valid JSON:
{"alternatives":[{"nameEn":"...","nameSecondary":"...","matchLevel":"Very close","comparison":"...","aisleHint":"..."}]}`,
    },
  ]
  return callOpenRouter(messages) as Promise<{ alternatives: AlternativeItem[] }>
}

export async function fetchInspire(itemName: string): Promise<{ recipes: RecipeItem[] }> {
  const messages = [
    {
      role: 'user' as const,
      content: `Suggest 3 recipes using "${itemName}". Return ONLY valid JSON:
{"recipes":[{"name":"...","nameSecondary":"...","description":"...","missingIngredients":[{"nameEn":"...","nameSecondary":"..."}]}]}`,
    },
  ]
  return callOpenRouter(messages) as Promise<{ recipes: RecipeItem[] }>
}
