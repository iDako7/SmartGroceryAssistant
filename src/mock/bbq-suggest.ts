import type { SuggestResult } from '../types'

export const BBQ_SUGGEST_RESULT: SuggestResult = {
  contextSummary: 'Fusion BBQ — balancing Korean and Western styles for ~2 people',
  clusters: [
    {
      id: 'c1', emoji: '🥩', name: 'Korean BBQ Core',
      description: 'Traditional Korean BBQ essentials for the grill',
      existingItemIds: ['i1', 'i2', 'i3', 'i4'], suggestionIds: ['s1', 's2'],
    },
    {
      id: 'c2', emoji: '🌭', name: 'Western BBQ Station',
      description: 'American classics to keep everyone happy',
      existingItemIds: ['i5', 'i6', 'i7', 'i8'], suggestionIds: ['s3', 's4'],
    },
    {
      id: 'c3', emoji: '🥂', name: 'Refreshments & Sides',
      description: 'Round out your BBQ spread with drinks and sides',
      existingItemIds: [], suggestionIds: ['s5', 's6', 's7'],
    },
  ],
  aisleGroups: [
    { id: 'a1', name: '🥩 Meat & Seafood', existingItemIds: ['i2'], suggestionIds: [] },
    { id: 'a2', name: '🌏 Asian Foods', existingItemIds: ['i1', 'i3', 'i4'], suggestionIds: ['s1', 's2'] },
    { id: 'a3', name: '🌭 Grocery', existingItemIds: ['i5', 'i6', 'i7'], suggestionIds: ['s3', 's4'] },
    { id: 'a4', name: '🧴 Condiments', existingItemIds: ['i8'], suggestionIds: [] },
  ],
  suggestions: [
    { id: 's1', nameEn: 'Sesame Oil', nameSecondary: '芝麻油', reason: 'Essential Korean BBQ dipping sauce base', clusterId: 'c1', isExtra: false },
    { id: 's2', nameEn: 'Gochujang', nameSecondary: '辣椒酱', reason: 'Authentic Korean BBQ marinade', clusterId: 'c1', isExtra: false },
    { id: 's3', nameEn: 'BBQ Sauce', nameSecondary: '烧烤酱', reason: 'Classic American grilling sauce', clusterId: 'c2', isExtra: false },
    { id: 's4', nameEn: 'Ketchup', nameSecondary: '番茄酱', reason: 'Perfect with hot dogs and burgers', clusterId: 'c2', isExtra: false },
    { id: 's5', nameEn: 'Corn on the Cob', nameSecondary: '玉米棒', reason: 'Great BBQ side dish', clusterId: 'c3', isExtra: false },
    { id: 's6', nameEn: 'Soju', nameSecondary: '烧酒', reason: 'Traditional Korean BBQ drink', clusterId: 'c3', isExtra: true },
    { id: 's7', nameEn: 'Coleslaw', nameSecondary: '卷心菜沙拉', reason: 'Classic BBQ side', clusterId: 'c3', isExtra: true },
  ],
}
