/** Merged view of `users` + `profiles` tables as returned by the backend API. */
export interface User {
  id: string;
  email: string;
  language_preference: string;
  dietary_restrictions: string[];
  household_size: number;
  taste_preferences: string;
}

export interface ProfileUpdate {
  language_preference?: string;
  dietary_restrictions?: string[];
  household_size?: number;
  taste_preferences?: string;
}

export interface Section {
  id: string;
  user_id: string;
  name: string;
  position: number;
}

export interface Item {
  id: string;
  section_id: string;
  name_en: string;
  name_secondary?: string;
  quantity: number;
  checked: boolean;
}

export interface FullList {
  sections: Section[];
  items: Record<string, Item[]>;
}

export interface AiJob {
  job_id: string;
  status: 'queued' | 'pending' | 'done';
  result?: unknown;
}

// ── AI Response Types (aligned with MVP-PRD §3) ──────────

/** POST /api/v1/ai/item-info */
export interface ItemInfoResponse {
  taste: string;
  usage: string;
  picking: string;
  storage: string;
  funFact: string;
}

/** POST /api/v1/ai/alternatives */
export interface AlternativesResponse {
  note: string;
  alts: {
    name_en: string;
    name_zh: string;
    match: 'Very close' | 'Similar' | 'Different but works';
    desc: string;
    where: string;
  }[];
}

/** POST /api/v1/ai/inspire (per-item) */
export interface PerItemInspireResponse {
  recipes: {
    name: string;
    name_zh: string;
    emoji: string;
    desc: string;
    add: { name_en: string; name_zh: string }[];
  }[];
}

/** Suggest response — powers Smart View + List View from a single call */
export interface SuggestResponse {
  reason: string;
  clusters: {
    name: string;
    emoji: string;
    desc: string;
    items: {
      name_en: string;
      name_zh: string;
      existing: boolean;
      why: string;
    }[];
  }[];
  ungrouped: {
    name_en: string;
    name_zh: string;
    existing: boolean;
  }[];
  storeLayout: {
    category: string;
    emoji: string;
    items: {
      name_en: string;
      name_zh: string;
      existing: boolean;
    }[];
  }[];
}

/** Clarifying questions before suggest (two-step flow) */
export interface ClarifyQuestion {
  text: string;
  text_zh: string;
  options: { label: string; label_zh: string }[];
}

export interface ClarifyResponse {
  questions: ClarifyQuestion[];
}
