import {
  Apple,
  Beef,
  CookingPot,
  Cookie,
  Egg,
  Fish,
  GlassWater,
  Milk,
  Package,
  Salad,
  Sandwich,
  ShoppingBasket,
  Store,
  Wheat,
  Wine,
  type LucideIcon,
} from 'lucide-react';

/**
 * Maps common emoji from AI responses to Lucide icons.
 * Covers grocery store categories. Falls back to ShoppingBasket.
 */
const emojiToIcon: Record<string, LucideIcon> = {
  // Produce / vegetables
  '🥬': Salad,
  '🥗': Salad,
  '🥦': Salad,
  '🥕': Salad,
  '🍅': Apple,
  '🍎': Apple,
  '🍏': Apple,
  '🍌': Apple,
  '🍇': Apple,
  '🫐': Apple,
  '🍑': Apple,
  '🥑': Apple,
  '🍊': Apple,
  '🍋': Apple,

  // Meat
  '🥩': Beef,
  '🍖': Beef,
  '🍗': Beef,
  '🐔': Beef,
  '🐄': Beef,

  // Seafood
  '🐟': Fish,
  '🐠': Fish,
  '🍣': Fish,
  '🦐': Fish,
  '🦞': Fish,

  // Dairy / eggs
  '🥛': Milk,
  '🧀': Milk,
  '🥚': Egg,
  '🍳': Egg,

  // Beverages
  '🍺': GlassWater,
  '🍷': Wine,
  '🥤': GlassWater,
  '🧃': GlassWater,
  '☕': GlassWater,
  '🍵': GlassWater,
  '🥂': Wine,

  // Bakery / grains
  '🍞': Wheat,
  '🥖': Wheat,
  '🥐': Wheat,
  '🍚': Wheat,
  '🌾': Wheat,

  // Condiments / cooking
  '🧂': CookingPot,
  '🫒': CookingPot,
  '🧈': CookingPot,
  '🍯': CookingPot,

  // Snacks / packaged
  '🍪': Cookie,
  '🍫': Cookie,
  '🍿': Cookie,
  '🧁': Cookie,

  // Deli / prepared
  '🥪': Sandwich,
  '🌮': Sandwich,
  '🍜': CookingPot,
  '🍲': CookingPot,

  // Store / general
  '🏪': Store,
  '🛒': ShoppingBasket,
  '📦': Package,
};

export function getCategoryIcon(emoji: string): LucideIcon {
  return emojiToIcon[emoji] ?? ShoppingBasket;
}
