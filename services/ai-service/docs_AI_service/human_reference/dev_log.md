# AI Service — Development Log

Concise record of decisions, experiments, and learnings. One entry per session/topic.
For full reasoning, see `design_decisions.md`. For open items, see `open_questions.md`.

---

## 2026-03-28 — OQ-2: Costco Product Data Sourcing

**Decision:** Scrape Costco Sameday via GraphQL API (two-step: Chrome MCP for ID discovery + GraphQL for batch fetch)

**What we tried:**
- bb-browser (browser automation) — couldn't reliably scroll/render pages, scroll events didn't trigger lazy loading
- Direct GraphQL API only — fast but collection queries need auth, so can't discover product IDs without a browser
- Chrome DevTools MCP only — full data including price, but slow (~4 min for 7 products due to sequential page navigation)
- **Winner:** Chrome DevTools MCP to scroll department pages and collect product IDs from Apollo cache, then GraphQL API to batch-fetch all product details (28s for 443 products)

**Benchmark (7 products, same data):**
- Chrome MCP: 238s, full data including price
- GraphQL API: 19s, everything except price (null without auth)

**Result:** 396 unique products (443 raw, 47 cross-department duplicates) across 7 departments — Meat & Seafood (58), Produce (69), Pantry (69), Deli & Dairy (56), Frozen (51), Snacks & Candy (76), Beverages (64). Verified 10 random products against Chrome MCP — 10/10 match.

**Key learnings:**
- Costco Sameday is Instacart-powered — Apollo Client with GraphQL backend
- `CollectionProductsWithFeaturedProducts` query needs auth, `Items` query doesn't (except for price field)
- Department pages load products lazily in subcategory carousels (~50-70 visible per department via scrolling, not the full catalog)
- Price excluded from scrape — requires session cookies, not needed for Phase 1 KB (translate/item-info/alternatives), and goes stale quickly
- 47 duplicates are mostly dairy/milk items appearing in both Beverages and Deli & Dairy

**Data:** `services/ai-service/data/costco_raw/` (one JSON per department + metadata.json)

**Fields per product:** productId, name, size, brandName, category, retailerRef, imageUrl, available
