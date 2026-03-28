# AI Service -- Open Questions

**Last updated:** 2026-03-27
**Purpose:** Unresolved decisions that need research or experimentation before implementation.

---

## OQ-1: LLM Model Selection

**Status:** Unresolved
**Blocks:** Phase 1 (need a model to call via OpenRouter)

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
**Blocks:** Phase 1 (need recipe data for KB)

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
**Blocks:** Phase 1 (affects KB tier routing quality)

**Context:** FTS5 returns ranked results with a relevance score. The hybrid tier routing uses this score to decide whether the KB match is "good enough" or should fall through to LLM.

**Research needed:**
- What do FTS5 `rank` values look like for good matches vs bad matches?
- Is there a natural gap in the score distribution (clear threshold)?
- How do different query types (exact product name, category search, vague description) distribute?

**Next action:** Implement FTS5 search in Phase 1, log all query scores, analyze the distribution over 50-100 test queries, pick threshold empirically. Start with a conservative threshold (high, prefer falling through to LLM) and lower it as confidence grows.

---

## OQ-5: Cache TTL Values Per Request Type

**Status:** Unresolved -- needs experimentation
**Blocks:** Phase 2

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
