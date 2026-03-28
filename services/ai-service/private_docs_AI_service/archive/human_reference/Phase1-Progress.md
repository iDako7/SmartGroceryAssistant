# Phase 1 — Progress Against PRD V1.0

**Date:** 2026-03-19
**Summary:** Assessment of Phase 1 (web-first MVP) completion status mapped to every functional requirement in PRD V1.0.

---

## Summary Dashboard

| PRD Section | Area | Status |
|---|---|---|
| 5.1 | Onboarding & Profile | Partial |
| 5.2 | List Building | Partial |
| 5.3 | Smart Suggestions | Partial |
| 5.4 | In-Store Mode | Not Started |
| 5.5 | Per-Item Education | Partial |
| 5.6 | Offline Mode & Local Agent | Not Started |
| 5.7 | Data Synchronization | Not Started |

---

## Detailed Assessment

### 5.1 Onboarding & Profile

| FR | Requirement | Status | Notes |
|---|---|---|---|
| FR-1 | Welcome screen on first launch | Not Started | No onboarding flow in the web app |
| FR-2 | Dietary chips, household size, taste prefs, language selector | Not Started | Profile fields exist in DB schema but no onboarding UI |
| FR-3 | Language selector with 3 options | Not Started | |
| FR-4 | "Create" and "Skip" actions | Not Started | |
| FR-5 | Profile persists locally and syncs to cloud | Partial | Profile table exists in PostgreSQL; `PUT /api/v1/users/me` updates it. No local persistence (web app). No onboarding UI to populate it. |

Profile data structures are fully defined in the database (language_preference, dietary_restrictions, household_size, taste_preferences) and the User Service exposes CRUD endpoints. However, there is no onboarding UI — users must register/login but are never prompted to fill out their profile.

---

### 5.2 List Building

| FR | Requirement | Status | Notes |
|---|---|---|---|
| FR-6 | Main view with sections and items | Done | Sections and items display in the main list view |
| FR-7 | Create Section and Edit Preferences buttons | Partial | Create Section exists. Edit Preferences navigates to profile page but profile editing UI is minimal. |
| FR-8 | Sample data on first launch | Not Started | No seed data or demo content |
| FR-9 | Items display name, quantity, bilingual names | Partial | name_en displays. name_secondary shows if present. No auto-translation on add. |
| FR-10 | Quantity field, default 1, adjustable | Done | Quantity editable via inline edit mode |
| FR-11 | Checkbox with strikethrough | Not Started | `checked` field exists in DB but UI uses click-to-select (emerald highlight) for AI panel selection, not a checkbox/strikethrough pattern |
| FR-12 | Delete and per-item AI action controls | Partial | Edit and Delete buttons on hover. No inline per-item AI buttons (Inspire, Alternatives, Item Info) — these are in the separate AI panel. |
| FR-13 | Inline name editing | Done | Edit mode with Save/Cancel |
| FR-14 | Rename and delete sections | Done | |
| FR-15 | Collapsible sections | Not Started | |
| FR-16 | Data persists locally, syncs to cloud, survives offline | Partial | Persists in PostgreSQL. No local persistence or offline survival. |
| FR-17 | Auto-translation via tiered inference on item add | Not Started | Translation exists as a manual action in the AI panel, not automatic on add |

Core list CRUD is functional — users can create sections, add/edit/delete items, and manage quantities. Key gaps: no checkbox/strikethrough interaction model (items use click-to-select instead), no collapsible sections, no auto-translation, no sample data.

---

### 5.3 Smart Suggestions

| FR | Requirement | Status | Notes |
|---|---|---|---|
| FR-18 | Suggest button on each section header | Not Started | Suggest is in the AI panel, not per-section |
| FR-19 | Suggest triggers recommendation flow; offline shows message | Partial | Suggest works via AI panel. No offline detection. |
| FR-20 | Cross-section awareness | Partial | All sections are sent to the AI, but the prompt does not explicitly instruct gap analysis across sections |
| FR-21 | Single AI call per Suggest; async via message queue | Done | Job enqueued to RabbitMQ, worker processes, result stored in Redis, client polls |
| FR-22 | 3-step reasoning chain (gap analysis → cultural match → recipe bridge) | Not Started | Prompt is simple: "suggest 5-10 additional items the user might need" — no structured reasoning chain |
| FR-23 | Response returns recipe clusters with bilingual names | Not Started | Response is a flat list `{name_en, category, reason}`, not recipe clusters |
| FR-24 | Pre-fetch for "More" batch in single call | Not Started | |
| FR-25 | Smart View as default after Suggest | Not Started | |
| FR-26 | Recipe cluster display with existing/new items | Not Started | Suggestions display as a flat list |
| FR-27 | Ungrouped section for non-cluster items | Not Started | |
| FR-28 | Editable context block | Not Started | |
| FR-29 | Edit context and Regenerate | Not Started | |
| FR-30 | Keep All button | Not Started | |
| FR-31 | More button for additional suggestions | Not Started | |
| FR-32 | Keep and Dismiss per suggestion | Not Started | Suggestions are read-only in the AI panel |
| FR-33 | Suggestions persist until acted on | Not Started | |

The async suggest pipeline works end-to-end (submit → queue → worker → LLM → Redis → poll). However, the AI prompt is simple (no 3-step reasoning chain), the response format is a flat list (no recipe clusters), and the UI has no Keep/Dismiss/Keep All actions — suggestions are display-only in the AI panel.

---

### 5.4 In-Store Mode

| FR | Requirement | Status | Notes |
|---|---|---|---|
| FR-34 | Toggle between Smart View and List View | Not Started | |
| FR-35 | List View organized by store aisle | Not Started | |
| FR-36 | Bilingual names, quantities, checkboxes in List View | Not Started | |
| FR-37 | Check off syncs across views | Not Started | |

In-Store Mode has not been implemented. The PRD envisioned a separate aisle-based view that users toggle to when shopping.

---

### 5.5 Per-Item Education

| FR | Requirement | Status | Notes |
|---|---|---|---|
| FR-38 | Inspire button on each item | Partial | Available as a tab in the AI panel, not a per-item button |
| FR-39 | Inspire via tiered inference with caching | Partial | Cloud-only (no tiered inference). Redis caching works. Returns 3 meals with missing ingredients. |
| FR-40 | "Add All" to add missing ingredients | Not Started | Missing ingredients are displayed but no "Add All" action |
| FR-41 | Expandable panel beneath item, cached | Not Started | Results show in the AI panel, not inline beneath the item |
| FR-42 | Alternatives button on each item | Partial | Available as a tab in the AI panel |
| FR-43 | Alternatives via tiered inference | Partial | Cloud-only. Returns alternatives with name and reason, but no match level or aisle hints. |
| FR-44 | "Use This" to replace item | Not Started | |
| FR-45 | Expandable panel beneath item, cached | Not Started | Results show in AI panel |
| FR-46 | Item Info button on each item | Partial | Available as a tab in the AI panel |
| FR-47 | Item Info via tiered inference | Partial | Cloud-only. Returns category, typical_unit, storage_tip, nutrition_note. Missing taste profile, cultural facts, how-to-pick. |
| FR-48 | Expandable panel beneath item, cached | Not Started | Results show in AI panel |
| FR-49 | Content in user's active language | Not Started | Always returns English |

All three per-item AI features (Info, Translate, Alternatives) work as synchronous cloud calls with Redis caching. However, they live in a separate AI panel (tabbed UI) rather than as inline per-item buttons/expandable panels. There is no tiered inference (no local KB), no "Add All" or "Use This" actions, and response fields differ from the PRD spec.

---

### 5.6 Offline Mode & Local Agent

| FR | Requirement | Status | Notes |
|---|---|---|---|
| FR-50 | Continuous network monitoring | Not Started | |
| FR-51 | Subtle offline indicator in header | Not Started | |
| FR-52 | Indicator is informational only | Not Started | |
| FR-53 | List management works fully offline | Not Started | |
| FR-54 | Item Info for Tier 1 from SQLite KB | Not Started | No SQLite KB exists |
| FR-55 | Item Info for Tier 2 from SQLite KB | Not Started | |
| FR-56 | Alternatives from local KB | Not Started | |
| FR-57 | Translation from local dictionary | Not Started | |
| FR-58 | Aisle navigation from local mappings | Not Started | |
| FR-59 | Suggest shows "requires network" badge offline | Not Started | |
| FR-60 | Complex Inspire requires network | Not Started | |
| FR-61 | Non-blocking offline toast | Not Started | |
| FR-62 | Tiered inference routing (Tier 0 → 1 → 2) | Not Started | All AI calls go directly to cloud |
| FR-63 | Routing transparent to user | N/A | |
| FR-64 | On-device SQLite knowledge base | Not Started | |
| FR-65 | Tiered content strategy (Tier 1/2/3) | Not Started | |
| FR-66 | KB syncs from Knowledge Service on WiFi | Not Started | |
| FR-67 | No KB sync over cellular without opt-in | Not Started | |

Offline mode and local intelligence are entirely unimplemented. This is expected — the web-first pivot defers offline capabilities, which are primarily a mobile concern.

---

### 5.7 Data Synchronization

| FR | Requirement | Status | Notes |
|---|---|---|---|
| FR-68 | Offline mutations recorded as deltas with vector clocks | Not Started | |
| FR-69 | Push pending deltas on reconnect | Not Started | |
| FR-70 | CRDT merge via Sync Service | Not Started | No Sync Service exists |
| FR-71 | Client replaces state with merged result | Not Started | |
| FR-72 | LWW for scalar fields | Not Started | |
| FR-73 | OR-Set for item collections | Not Started | |
| FR-74 | Section deletion conflict resolution | Not Started | |
| FR-75 | Fully deterministic conflict resolution | Not Started | |
| FR-76 | Sync triggers (online transition, push notification, foreground) | Not Started | |
| FR-77 | Real-time sync via WebSocket | Not Started | Gateway has WS relay code but List Service has no WS endpoint |

Data synchronization is entirely unimplemented. The Sync Service does not exist. The WebSocket relay in the Gateway attempts to connect to a non-existent List Service `/ws` endpoint.

---

## Infrastructure & Architecture Status

| PRD Component | Planned | Phase 1 Status |
|---|---|---|
| API Gateway (Fastify) | Routing, JWT, rate limiting, WS, Consul | Done — all except WS (broken) and Consul (omitted) |
| User Service (Go) | Accounts, profiles, preferences | Done |
| List Service (Go) | Sections, items, CRDT vector clocks | Partial — CRUD done, no CRDT/vector clocks |
| AI Service (Python) | Tiered inference, async workers, circuit breaker | Partial — async workers done, no tiered inference, no circuit breaker |
| Knowledge Service (Go) | Product DB, bilingual dicts, aisle maps, sync payloads | Not Started |
| Sync Service (Go) | WebSocket, CRDT merge, conflict resolution, real-time push | Not Started |
| PostgreSQL | Primary data store | Done — user_db and list_db |
| Redis | AI response cache | Done |
| RabbitMQ | Async AI jobs + list change events | Partial — AI jobs work; list events published but unconsumed |
| Consul | Service discovery | Not Started (static URLs used instead) |
| React Native mobile app | Primary client | Not Started (web-first pivot to Next.js) |
| On-device SQLite KB | Tier 0/1 product knowledge | Not Started |
| gRPC (inter-service) | Service-to-service communication | Not Started (REST used instead) |

---

## Intentionally Deferred

The following items from PRD V1.0 were consciously excluded from Phase 1 as part of the web-first pivot:

- **Mobile app (React Native)** — replaced by Next.js web client
- **On-device SQLite knowledge base** — not applicable to web; requires Knowledge Service
- **CRDT sync / delta store / vector clocks** — requires Sync Service and offline-capable client
- **Knowledge Service** — no local KB to sync; all AI calls go to cloud
- **Sync Service** — no offline mode or multi-device sync
- **gRPC (inter-service communication)** — REST is simpler for Phase 1
- **Consul (service discovery)** — static environment variable URLs
- **Offline-first architecture** — web app requires connectivity
- **Tiered inference routing** — all AI calls go directly to cloud (Tier 2)
- **Circuit breaker on AI calls** — not implemented

---

## PRD Validation Criteria Checklist

Mapped from PRD Section 12.

### List Building

- [ ] Onboarding: user can set profile (including language) or skip directly; data persists
- [x] Main view: user can create sections and items; sample data shown on first launch
  - *Sections and items work; sample data is not shown*
- [x] Items: user can set name and quantity (default 1); can check off and delete items
  - *Name and quantity work; delete works; "check off" is click-to-select (not checkbox/strikethrough)*
- [ ] Bilingual: typing in any language auto-translates on add; bilingual names display correctly
- [x] Sections: user can rename, delete, and collapse sections
  - *Rename and delete work; collapse is not implemented*

### Smart Suggestions

- [ ] Suggest: tapping "Suggest" calls AI Service asynchronously and returns clustered suggestions with context block
  - *Async call works; returns flat list, not clusters; no context block*
- [ ] Smart View: suggestions display as recipe clusters with existing and new items distinguished
- [ ] List View: items organized by store aisle; toggle between Smart/List View
- [ ] Keep All: tapping "Keep All" adds all visible suggested items as regular items
- [ ] Keep/Dismiss: user can keep or dismiss individual suggestions
- [ ] Edit context: user can modify context block and regenerate
- [ ] More: tapping "More" reveals additional suggestions

### Per-Item Education

- [ ] Inspire: tapping returns recipe ideas; "Add All" adds missing ingredients
  - *Recipe ideas returned via AI panel; no "Add All" action*
- [ ] Alternatives: tapping returns substitutes; "Use This" replaces item
  - *Alternatives returned via AI panel; no "Use This" action*
- [ ] Item Info: tapping returns educational content about taste, usage, storage
  - *Returns category/unit/storage/nutrition via AI panel; missing taste profile and cultural facts*
- [ ] Per-item caching: repeat taps do not fire new API calls
  - *Redis caching works for sync endpoints*
- [ ] Tiered routing: Item Info for Tier 1 products served from local KB

### Offline Mode

- [ ] Airplane mode: checklist, check-off, quantity changes all work
- [ ] Airplane mode: Item Info from local KB for Tier 1 products
- [ ] Airplane mode: bilingual name + aisle for Tier 2 products
- [ ] Airplane mode: aisle navigation works from local mappings
- [ ] Airplane mode: Suggest shows "requires network" badge
- [ ] Offline indicator in header

### Data Synchronization

- [ ] Offline changes sync to cloud within 10 seconds on reconnect
- [ ] Two devices edit same list offline: merge with no data loss
- [ ] Add/delete conflict: add wins (item preserved)
- [ ] All data persists across sessions and survives offline periods
