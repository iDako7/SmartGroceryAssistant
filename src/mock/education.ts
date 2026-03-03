import type { ItemPanelCache, PanelType } from '../types'

export const MOCK_EDUCATION: Record<string, ItemPanelCache> = {
  i2: {
    info: {
      tasteProfile: 'Rich, fatty, and savory with a perfect balance of meat and fat that becomes meltingly tender when cooked.',
      commonUses: 'Korean BBQ (samgyeopsal), Chinese red-braised pork (hong shao rou), ramen topping, sandwiches.',
      howToPick: 'Look for even layers of fat and meat. Fresh pork belly should be pink, not gray. The fat should be white and firm.',
      storageTips: 'Keep refrigerated and use within 2–3 days, or freeze for up to 3 months. Wrap tightly to prevent freezer burn.',
      funFact: 'In Korea, samgyeopsal (grilled pork belly) is the most popular BBQ dish — "three-layer flesh" refers to alternating fat and meat layers.',
    },
    alternatives: {
      alternatives: [
        { nameEn: 'Pork Shoulder', nameSecondary: '猪肩肉', matchLevel: 'Very close', comparison: 'Similar fat content and flavor. Great for BBQ, just needs a bit longer to cook.', aisleHint: 'Meat & Seafood aisle' },
        { nameEn: 'Beef Short Ribs', nameSecondary: '牛小排', matchLevel: 'Similar', comparison: 'Richer, beefier flavor. Korean-style galbi is a classic BBQ alternative.', aisleHint: 'Meat & Seafood aisle' },
        { nameEn: 'Chicken Thighs', nameSecondary: '鸡腿肉', matchLevel: 'Different but works', comparison: 'Leaner and lighter. Marinates well and cooks faster on the grill.', aisleHint: 'Meat & Seafood aisle' },
      ],
    },
  },
  i3: {
    inspire: {
      recipes: [
        { name: 'Kimchi Jjigae', nameSecondary: '泡菜汤', description: 'A hearty Korean stew with kimchi, tofu, and pork.', missingIngredients: [{ nameEn: 'Gochugaru', nameSecondary: '辣椒粉' }, { nameEn: 'Anchovy Stock', nameSecondary: '鱼汤' }, { nameEn: 'Green Onions', nameSecondary: '葱' }] },
        { name: 'Kimchi Fried Rice', nameSecondary: '泡菜炒饭', description: 'Quick and satisfying fried rice using fermented kimchi.', missingIngredients: [{ nameEn: 'Cooked Rice', nameSecondary: '米饭' }, { nameEn: 'Sesame Oil', nameSecondary: '芝麻油' }] },
        { name: 'Kimchi Burger Topping', nameSecondary: '泡菜汉堡配料', description: 'Elevate your burgers with tangy, spicy kimchi.', missingIngredients: [{ nameEn: 'Mayo', nameSecondary: '蛋黄酱' }, { nameEn: 'Sesame Seeds', nameSecondary: '芝麻' }] },
      ],
    },
  },
}

export function buildFallbackPanelData(itemName: string, type: PanelType): ItemPanelCache {
  if (type === 'info') {
    return { info: { tasteProfile: `${itemName} has a distinctive flavor profile.`, commonUses: 'Commonly used in various dishes.', howToPick: `Look for fresh, high-quality ${itemName}.`, storageTips: 'Store in a cool, dry place or refrigerate as needed.', funFact: `${itemName} is enjoyed in many cuisines around the world.` } }
  }
  if (type === 'alternatives') {
    return { alternatives: { alternatives: [{ nameEn: 'Option A', nameSecondary: '', matchLevel: 'Very close', comparison: 'Similar in taste and texture.', aisleHint: 'General grocery aisle' }, { nameEn: 'Option B', nameSecondary: '', matchLevel: 'Similar', comparison: 'Works well as a substitute.', aisleHint: 'General grocery aisle' }, { nameEn: 'Option C', nameSecondary: '', matchLevel: 'Different but works', comparison: 'Different but can be used.', aisleHint: 'General grocery aisle' }] } }
  }
  return { inspire: { recipes: [{ name: `${itemName} Dish 1`, nameSecondary: '', description: 'A delicious preparation.', missingIngredients: [{ nameEn: 'Spice Mix', nameSecondary: '' }] }, { name: `${itemName} Dish 2`, nameSecondary: '', description: 'Another great option.', missingIngredients: [{ nameEn: 'Sauce', nameSecondary: '' }] }, { name: `${itemName} Dish 3`, nameSecondary: '', description: 'Creative and tasty.', missingIngredients: [{ nameEn: 'Herbs', nameSecondary: '' }] }] } }
}
