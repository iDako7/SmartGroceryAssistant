# Smart Grocery — Prototype Task Plan

## Project Overview

Build a demoable web prototype of Smart Grocery — an AI-powered grocery shopping assistant modeled after Apple Reminders' Groceries list. Users maintain section-based grocery lists, get AI-powered recipe-clustered suggestions, and learn about unfamiliar products through per-item education panels. The prototype showcases the product idea for investors, HR, and CS students.

**Stack:** Vite + React + TypeScript + Tailwind CSS (v4)
**Target viewport:** 390px mobile (present in browser responsive mode)
**Design benchmark:** Apple Reminders — Groceries list. Calm, confident, zero clutter.
**Mock data:** See `mock-data.md` for all pre-stored BBQ with Mark scenario content.
**Reference artifact:** The existing Claude artifact from this project's "Grocery shopping assistant app design" chat implements all features in a single React file. Use it as behavioral reference for interactions and data flow, but build this as a proper multi-file project.

---

## Phase Overview

| Phase  | Feature            | Verification (User Stories)                                                        |
| ------ | ------------------ | ---------------------------------------------------------------------------------- |
| **1A** | List Shell         | User can see, check, edit, and manage a bilingual grocery list                     |
| **1B** | Smart Suggest      | User taps Suggest → answers Quick Questions → sees recipe clusters → toggles views |
| **1C** | Per-Item Education | User taps ⓘ / 🔄 / 💡 on any item → sees expandable education panel                |
| **1D** | Onboarding         | First-time user sets language + dietary + household + taste preferences            |
| **2A** | API Layer          | Service layer calls OpenRouter, returns parsed typed responses                     |
| **2B** | Live Suggest       | Suggest returns real AI-generated recipe clusters                                  |
| **2C** | Live Education     | Inspire, Alternatives, Item Info return real AI content                            |
| **2D** | Auto-Translation   | Adding an item in Chinese/French auto-translates to bilingual display              |

---

## Trimmed Scope (explicitly excluded)

- Offline mode, sync, CRDT, multi-device (distributed systems features — not prototype material)
- US-9: Edit context block + Regenerate
- US-15–18: Offline/sync features
- Backend / microservices / database
- Authentication / user accounts
- localStorage or sessionStorage (state resets on refresh — demo starts from known state)
- Drag-and-drop reordering

---

## Design Reference

**Aesthetic:** Warm, inviting, minimal. NOT cold or clinical. Soft shadows, rounded corners, generous whitespace.

**Color palette:**

- Primary: muted forest green (section headers, CTAs, checkmarks)
- Accent: warm terracotta (Suggest button, "NEW" badges, suggestion highlights)
- Background: warm off-white
- Suggestion items: warm tinted background with dashed border
- Cluster cards: colored left border accent stripe

**Key visual patterns from screenshots:**

- View tabs (Flat / Smart / Aisles) sit inside each section card, below section header
- Tabs only appear AFTER Suggest has been run on that section
- Smart view: clusters have emoji + name + description header, existing items are normal, suggestions have sparkle prefix + reason text + Keep/Dismiss
- Aisles view: grouped by store department, suggestions show "NEW" badge instead of quantity
- Flat view: full CRUD controls (ⓘ, 🔄, quantity, 💡, ✏️, 🗑️). Smart/Aisles views show only ⓘ and 🔄

---

## Phase 1A: List Shell

**Goal:** Main list view with sections, items, checkboxes, quantities, bilingual display. Pre-loaded with the BBQ with Mark demo data. This alone is a working demoable app.

### User Stories to Verify

- **US-1A.1:** App renders with "BBQ with Mark" section containing 8 bilingual items (English + Chinese). Each item shows primary name and secondary name in smaller/lighter text.
- **US-1A.2:** Tapping an item's checkbox toggles strikethrough + muted styling. Tapping again unchecks it.
- **US-1A.3:** Tapping the quantity badge on an item allows changing quantity (1–9). Default is 1.
- **US-1A.4:** Tapping "+ Add Item" at the bottom of a section shows an inline text input. Typing a name and pressing Enter adds the item to the section.
- **US-1A.5:** User can create a new section via the "+" button in the header. Section appears with an editable name.
- **US-1A.6:** User can rename a section by tapping its name. User can delete a section.
- **US-1A.7:** User can delete individual items.
- **US-1A.8:** Tapping the section header chevron collapses/expands the section.
- **US-1A.9:** View tabs (Flat/Smart/Aisles) are NOT visible — no Suggest has been run yet.
- **US-1A.10:** Layout is mobile-responsive at 390px. All touch targets are at least 44px.

### Initial Data

Pre-load "BBQ with Mark" section with 8 items from `mock-data.md` → Initial Items table. Default user profile: language `en_zh`, household size 2.

---

## Phase 1B: Smart Suggest

**Goal:** Tap Suggest → Quick Questions → loading → Smart View with recipe clusters → toggle to Aisles view. All from pre-stored mock data.

### Suggest Flow

1. User taps "✨ Suggest" on section header
2. Quick Questions panel slides down (3 bilingual questions with chip-select options, "Skip →" link)
3. User answers or skips → "Get Suggestions →" triggers suggest
4. Loading state (~1.5s simulated delay): section card pulses gently
5. View tabs appear (Flat / Smart / Aisles), section switches to Smart View
6. Smart View renders with recipe clusters + context block + Keep All

### User Stories to Verify

- **US-1B.1:** Tapping "✨ Suggest" shows the Quick Questions panel with 3 bilingual questions (occasion, headcount, sides needed). Each question has chip-select options.
- **US-1B.2:** User can answer questions by tapping chips, then tap "Get Suggestions →" to trigger suggest. Alternatively, tapping "Skip →" triggers suggest without answers.
- **US-1B.3:** After loading (~1.5s), Smart View appears showing 3 recipe clusters (Korean BBQ Core, Western BBQ Station, Refreshments & Sides) plus an Ungrouped section.
- **US-1B.4:** Each cluster shows an emoji + name header, description line, and a mix of existing items (normal style) and suggested items (tinted background, sparkle prefix, reason text, Keep/Dismiss buttons).
- **US-1B.5:** Context block at top shows recommendation reasoning with a "✓ Keep All" button to its right.
- **US-1B.6:** Tapping "Keep" on a suggested item promotes it to a regular item (loses suggestion styling, gains quantity).
- **US-1B.7:** Tapping dismiss (✕) on a suggested item removes it with a slide-out animation.
- **US-1B.8:** Tapping "Keep All" promotes all visible suggested items at once.
- **US-1B.9:** "More" button at bottom reveals 2 additional pre-fetched suggestions, then disappears.
- **US-1B.10:** Switching to "🏪 Aisles" tab shows the same items grouped by store department (Meat & Seafood, Produce, Asian Foods, Bakery, Condiments, Beverages). Suggested items show "NEW" badge.
- **US-1B.11:** Switching back to "📋 Flat" tab shows the original flat list.
- **US-1B.12:** Checking off an item in any view syncs across all three views.

---

## Phase 1C: Per-Item Education

**Goal:** Tap ⓘ, 🔄, or 💡 on any item to see expandable education panels with mock content.

### Three Panel Types

**💡 Inspire** — 3 recipe ideas using that item. Each recipe has a name (bilingual), description, and list of missing ingredients. Each recipe has an "Add All" button that adds missing ingredients to the section.

**🔄 Alternatives** — 3 substitutes with match level badge (color-coded: green="Very close", amber="Similar", red-orange="Different but works"), comparison description, and aisle hint. Each has a "Use This" button that replaces the original item.

**ℹ️ Item Info** — Educational content: taste profile, common uses, how to pick, storage tips, fun fact. Displayed in user's active language.

### User Stories to Verify

- **US-1C.1:** Tapping ℹ️ on "Pork Belly" shows an expandable panel below the item with taste profile, common uses, how to pick, storage tips, and a fun fact. Content mentions Korean BBQ and Chinese braised pork.
- **US-1C.2:** Tapping 🔄 on "Pork Belly" shows an Alternatives panel with 3 substitutes (Pork Shoulder / Very close, Beef Short Ribs / Similar, Chicken Thighs / Different but works). Match level badges are color-coded.
- **US-1C.3:** Tapping "Use This" on an alternative replaces "Pork Belly" with the selected substitute (name + translation swap).
- **US-1C.4:** Tapping 💡 on "Kimchi" shows an Inspire panel with 3 recipes (Kimchi Jjigae, Kimchi Fried Rice, Kimchi Burger Topping). Each shows missing ingredients.
- **US-1C.5:** Tapping "Add All" on a recipe adds the missing ingredients to the current section as new bilingual items.
- **US-1C.6:** First tap on any education icon shows a loading spinner (~0.5–0.8s), then caches the result. Repeat taps toggle the panel open/closed without re-fetching.
- **US-1C.7:** Only one panel per item open at a time — opening Inspire closes Item Info if it was open.
- **US-1C.8:** Panels work in all three views (Flat, Smart, Aisles).

---

## Phase 1D: Onboarding

**Goal:** Welcome screen on first launch. Profile affects bilingual display throughout the app.

### User Stories to Verify

- **US-1D.1:** On first load (no profile in state), app shows a full-screen onboarding with title "Welcome to Smart Grocery", language selector (3 options: English only / English + 简体中文 / English + Français), dietary restriction chips (multi-select), household size selector (1/2/3/4+), and taste preferences text input.
- **US-1D.2:** Tapping "Create" saves the profile and proceeds to the main list view.
- **US-1D.3:** Tapping "Skip" proceeds directly to the main list view without saving a profile. No nudge or reminder.
- **US-1D.4:** If user selects "English only" as language, all secondary language text (Chinese/French) is hidden throughout the app.
- **US-1D.5:** Profile is accessible and editable via a gear icon in the header.

---

## Phase 2A: API Layer Setup

**Goal:** Shared OpenRouter client + prompt templates. Service layer swap from mock to real.

The service layer pattern from Phase 1 (each feature goes through a service function returning typed data) makes this swap simple. Each service function has a mock implementation (Phase 1) and a real implementation (Phase 2) behind the same interface.

**Environment:** `VITE_OPENROUTER_API_KEY` in `.env`
**Model:** `anthropic/claude-sonnet-4-20250514` (or configurable)
**Response format:** JSON mode — all prompts request structured JSON matching the TypeScript types.

### User Stories to Verify

- **US-2A.1:** API client successfully calls OpenRouter and returns a parsed response.
- **US-2A.2:** If API call fails (network error, bad key), the app shows a friendly toast message and does not crash.

---

## Phase 2B: Live Suggest

**Goal:** Replace mock Suggest with real AI call.

The prompt should use a 3-step reasoning chain: (1) gap analysis — what's missing, (2) cultural match — align with user background, (3) recipe clustering — group into coherent clusters. The response must include both the recipe clusters (for Smart View) and aisle layout (for Aisles View) in a single call.

### User Stories to Verify

- **US-2B.1:** Tapping Suggest with the BBQ items returns AI-generated recipe clusters that sensibly group the Korean and Western items together.
- **US-2B.2:** The AI response correctly identifies this as a fusion BBQ and suggests items that bridge both cuisines.
- **US-2B.3:** The aisle layout in the response correctly groups items by store department.
- **US-2B.4:** Keep/Dismiss/Keep All still work with live AI responses.

---

## Phase 2C: Live Education

**Goal:** Replace mock Inspire, Alternatives, Item Info with real AI calls.

### User Stories to Verify

- **US-2C.1:** Tapping 💡 on any item returns 3 AI-generated recipe ideas with relevant missing ingredients.
- **US-2C.2:** Tapping 🔄 on any item returns 3 contextually appropriate substitutes with match levels.
- **US-2C.3:** Tapping ℹ️ on any item returns educational content (taste, usage, storage, fun fact).
- **US-2C.4:** Results are cached — tapping the same icon on the same item does not fire a second API call.
- **US-2C.5:** "Add All" and "Use This" still work with live AI responses.

---

## Phase 2D: Auto-Translation on Item Add

**Goal:** When user adds an item in any language, auto-translate to bilingual display.

### User Stories to Verify

- **US-2D.1:** User types "酱油" (soy sauce in Chinese) → item displays as "Soy Sauce / 酱油".
- **US-2D.2:** User types "Maple Syrup" in English → item displays as "Maple Syrup / 枫糖浆" (when language is en_zh).
- **US-2D.3:** If language is "English only", no translation occurs — item displays as typed.
- **US-2D.4:** If translation API fails, item displays with original input text only (no crash).

---

## Type Definitions (API Contracts)

These define the data shapes shared between the service layer and UI. They also define the JSON structure that AI prompts request in Phase 2. Keep these as the source of truth.

```typescript
// ─── User Profile ───
interface UserProfile {
  language: "en" | "en_zh" | "en_fr";
  dietary: string[];
  householdSize: number;
  tastePrefs: string;
}

// ─── Core Data ───
interface GroceryItem {
  id: string;
  nameEn: string;
  nameSecondary?: string;
  quantity: number;
  checked: boolean;
  isSuggestion: boolean;
  suggestionMeta?: {
    reason: string;
    clusterName?: string;
  };
}

interface Section {
  id: string;
  name: string;
  items: GroceryItem[];
  collapsed: boolean;
  activeView: "flat" | "smart" | "aisles";
  suggestData?: SuggestResponse;
  quickAnswers?: QuickAnswers;
}

// ─── Quick Questions ───
interface QuickQuestion {
  id: string;
  questionEn: string;
  questionSecondary?: string;
  options: { labelEn: string; labelSecondary?: string; value: string }[];
  allowOther: boolean;
}

type QuickAnswers = Record<string, string>;

// ─── Suggest Response ───
interface SuggestResponse {
  contextSummary: string;
  clusters: {
    id: string;
    emoji: string;
    name: string;
    description: string;
    items: {
      nameEn: string;
      nameSecondary?: string;
      existing: boolean;
      reason?: string;
      quantity?: number;
    }[];
  }[];
  ungrouped: {
    items: {
      nameEn: string;
      nameSecondary?: string;
      existing: boolean;
      quantity?: number;
    }[];
  };
  aisleLayout: {
    emoji: string;
    aisleName: string;
    items: {
      nameEn: string;
      nameSecondary?: string;
      quantity: number;
      checked: boolean;
      isSuggestion: boolean;
      itemId?: string;
    }[];
  }[];
  moreSuggestions: {
    nameEn: string;
    nameSecondary?: string;
    reason: string;
    clusterName?: string;
  }[];
}

// ─── Inspire ───
interface InspireResponse {
  recipes: {
    name: string;
    nameSecondary?: string;
    description: string;
    missingIngredients: { nameEn: string; nameSecondary?: string }[];
  }[];
}

// ─── Alternatives ───
interface AlternativesResponse {
  note?: string;
  alternatives: {
    nameEn: string;
    nameSecondary?: string;
    matchLevel: "Very close" | "Similar" | "Different but works";
    comparison: string;
    aisleHint: string;
  }[];
}

// ─── Item Info ───
interface ItemInfoResponse {
  tasteProfile: string;
  commonUses: string;
  howToPick: string;
  storageTips: string;
  funFact: string;
}
```
