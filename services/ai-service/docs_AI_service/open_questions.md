# AI Service -- Open Questions

**Last updated:** 2026-03-28
**Purpose:** Unresolved decisions that need research or experimentation before implementation.

---

## OQ-1: LLM Model Selection

**Status:** Unresolved
**Blocks:** Phase 1 (resolve by testing prompts against candidate models)

**Context:** Using OpenRouter as the LLM gateway. Need to select 1-2 models optimized for grocery domain tasks.

**Research needed:**
- Benchmark 3-5 candidate models: GPT-4o-mini, Claude 3.5 Haiku, Qwen, Gemini Flash, Llama 3
- Evaluation criteria: cost per token, multilingual quality (Chinese, Korean, Spanish), structured JSON output support, latency, availability on OpenRouter
- Test with representative prompts: translate, item-info, suggest, inspire

**Next action:** Create a benchmark script that sends 10 test prompts to each model via OpenRouter, measure cost + latency + output quality. Document results.

---

## OQ-2: Costco Product Data Sourcing

**Status:** Resolved (2026-03-28)
**Blocks:** None

**Decision:** Scraped Costco Sameday (Instacart-powered) via GraphQL API. 443 products (396 unique) across 7 departments.

**Method:** Two-step approach:
1. Chrome DevTools MCP to discover product IDs by scrolling department pages (Apollo cache extraction)
2. GraphQL API batch fetch for product details (name, size, brand, category, retailerRef, imageUrl, availability)

**What we got:** 7 departments — Meat & Seafood (58), Produce (69), Pantry (69), Deli & Dairy (56), Frozen (51), Snacks & Candy (76), Beverages (64). Price excluded (requires auth, not needed for Phase 1, goes stale quickly).

**Verification:** 10 random products verified against Chrome MCP product pages — 10/10 match.

**Data location:** `services/ai-service/data/costco_raw/` (one JSON per department)

**Fields per product:** productId, name, size, brandName, category, retailerRef, imageUrl, available

**What's NOT included (future work):**
- Multilingual names (name_zh, name_ko, name_es) — to be added via LLM translation or manual curation
- Aisle hints — not available from Sameday, would need in-store data
- Price — requires auth, changes frequently, not needed for Phase 1 KB queries

---

## OQ-3: KB Seed Data - Cuisines and Recipes

**Status:** Unresolved
**Blocks:** Phase 4 (need recipe data for KB seed)

**Context:** Starting with 2-3 cuisines. Target audience is new immigrants, so cuisine selection should reflect common immigrant communities near Costco locations.

**Research needed:**
- Which cuisines to prioritize (Chinese, Korean, Mexican are candidates -- confirm based on target user demographics)
- Recipe sources: public domain cookbooks, LLM-generated + human-reviewed, community-contributed?
- Recipe-to-Costco-product mapping: how to match recipe ingredients to specific Costco products
- How many recipes per cuisine is "enough" for MVP (10? 20?)
- Schema for recipe-ingredient relationships (quantities, optional ingredients, substitutions)

**Next action:** Define final KB schema, select 2-3 cuisines, generate 10 recipes per cuisine via LLM, manually validate ingredient-to-product mappings.

---

## OQ-4: Confidence Threshold for KB Fuzzy Search

**Status:** Unresolved -- needs experimentation
**Blocks:** Phase 4 (affects KB tier routing quality)

**Context:** FTS5 returns ranked results with a relevance score. The hybrid tier routing uses this score to decide whether the KB match is "good enough" or should fall through to LLM.

**Research needed:**
- What do FTS5 `rank` values look like for good matches vs bad matches?
- Is there a natural gap in the score distribution (clear threshold)?
- How do different query types (exact product name, category search, vague description) distribute?

**Next action:** Implement FTS5 search in Phase 1, log all query scores, analyze the distribution over 50-100 test queries, pick threshold empirically. Start with a conservative threshold (high, prefer falling through to LLM) and lower it as confidence grows.

---

## OQ-5: Cache TTL Values Per Request Type

**Status:** Unresolved -- needs experimentation
**Blocks:** Phase 5

**Context:** Different request types have different freshness needs. Starting values needed, then tune based on measured hit rates.

**Starting hypothesis:**
- `translate`: 24h (translations are stable)
- `item_info`: 6h (product data changes rarely)
- `alternatives`: 6h (substitution data is stable)
- `suggest`: 1h (user-context-dependent, but repeated similar lists should cache)
- `inspire`: don't cache (users expect variety)

**Next action:** Implement with hypothesis values in Phase 2. Measure hit rates per request type. Adjust based on data.

---

## OQ-6: AWS ECS Fargate Configuration

**Status:** Unresolved -- deferred until deployment
**Blocks:** Nothing until post-Phase 3

**Context:** Decided on ECS Fargate for deployment. Need to plan the AWS infrastructure.

**Research needed:**
- VPC setup: public subnets for ALB, private subnets for services?
- Service discovery: AWS Cloud Map vs ALB-based routing?
- Container sizing: AI service needs more memory/CPU than Gateway (LLM response parsing, KB queries). What's the right Fargate task size?
- Cost estimation: estimate monthly cost for all services at 10-user load
- CI/CD: GitHub Actions -> ECR -> ECS deployment pipeline
- Secrets management: AWS Secrets Manager for API keys, JWT secret

**Next action:** Defer detailed planning until Phase 3 is complete. Sketch high-level network topology as a reference.

---

## OQ-7: Routine Grocery Shopping (Scenario 1) — Post-MVP Feature

**Status:** Deferred — post-MVP
**Blocks:** Nothing in current phases

**Context:** The current MVP solves Scenario 2: grocery shopping for a specific plan (e.g., BBQ party, weekly meal prep). But there's an unaddressed Scenario 1: **routine, flexible grocery shopping** — where the user has no specific meal plan, shops on a regular cadence, and needs guidance based on what they already have, what they're running low on, and what variety they want.

**Real-world example:** User has plenty of vegetables and carbs but has been eating shrimp and ground beef for weeks. They want protein variety suggestions and a balanced restock list — not a recipe-driven shopping list.

**Inspiration:** The [Cookwell](https://www.cookwell.com/) PCSV framework (Protein, Carb, Sauce, Vegetable) treats meals as **swappable component slots** rather than fixed recipes. Key insights:
- **Flavor profiles > cuisine labels** — aroma profiles (spicy-umami, sweet-savory, sour-fresh) define food identity better than cuisine names. Gochujang and doubanjiang are both "spicy-umami" — a user who likes one will likely enjoy the other, regardless of Korean vs Chinese labeling.
- **Component-slot thinking** — any meal = protein + carb + sauce + vegetable. Shopping becomes "fill the slots" rather than "follow the recipe."
- **Grocery loop** — leftovers inform next purchase → purchases inform cooking → cooking creates new leftovers → loop. Requires purchase history and consumption awareness.
- Cookwell tags ingredients by **molecular role** (protein, fat, carb) AND **taste function** (spicy, umami, sweet, sour, creamy, crispy) simultaneously, enabling substitutions based on *why* an ingredient is in a dish.

**Proposed endpoint (future):**
```
POST /api/v1/ai/restock
{
  "current_inventory": [
    {"name": "shrimp", "component_role": "protein"},
    {"name": "ground beef", "component_role": "protein"},
    {"name": "celery", "component_role": "vegetable"},
    ...
  ],
  "preferences": {
    "flavor_likes": ["spicy", "umami"],
    "avoid": ["shrimp"],           // tired of it
    "component_gaps": ["protein"]  // detected or user-specified
  }
}
```

**Data model prep (included in Phase 1 KB schema):** To avoid costly re-seeding later, the following are tagged during initial seed:
- `component_role` column on `products` — tags each product as protein/carb/vegetable/sauce/dairy/pantry
- `flavor_tags` junction table — maps products to flavor descriptors (spicy, umami, sweet, savory, sour, smoky, creamy)
- `flavor_profile` column on `recipes` — e.g., "spicy-savory", enabling cross-cuisine recommendations

These columns are **not exercised by any MVP endpoint** but are populated during seed because the marginal cost is near zero while the data is already being handled.

**What's NOT needed until this feature is built:**
- Inventory tracking / purchase history (product feature, not AI service concern)
- Gap detection algorithm (which component slots are underrepresented)
- Grocery loop intelligence (feedback between purchases and consumption)
- Mood-based discovery (Cookwell's "Bad Day", "Lazy", "Date Night" tags — nice-to-have, purely additive)

**Next action:** Finish MVP (Phases 1-3). Then design the `/restock` endpoint, gap detection logic, and inventory integration. The data model groundwork is already in place.
