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
