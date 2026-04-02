# Suggest Eval Report: Prompt Iteration Experiment

The suggest endpoint is the heaviest AI call — it takes a full grocery list + clarify answers and returns clustered meal suggestions, gap analysis, and a store layout. We evaluated 5 models across 2 tiers (cheap and mid), ran 2 prompt iterations, and identified a structural limitation that prompt changes alone cannot fix.

## 1. What We Tested

8 test cases covering core behavior, edge cases, and profile variants:

### Core behavior (4 cases)
| Case | Grocery list | Answers | What it tests |
|------|-------------|---------|---------------|
| Asian weeknight dinner | chicken thighs, rice, soy sauce, garlic, ginger, bok choy | Weeknight dinner / Family of 4 / Asian | Cuisine-coherent clusters, sensible new items |
| Mixed cuisine fusion | tortillas, cheese, kimchi, chicken, rice | Korean-Mexican fusion / Date night | Respects fusion direction from answers |
| Baking for party | flour, sugar, butter, eggs, vanilla, chocolate chips | Baking cookies / Kids' birthday party | Non-meal clusters (baking-focused, not savory) |
| Large meal-prep | 16 items across Produce/Meat/Dairy/Pantry | Meal prep for the week / 2 adults | Handles complexity, tracks all items |

### Edge cases (2 cases)
| Case | What it tests |
|------|---------------|
| No clarify answers (Italian-leaning list) | Works without user context, infers cuisine from items |
| Minimal list (pasta + tomatoes only) | Proportional suggestions, doesn't over-plan from 2 items |

### Profile variants (2 cases)
| Case | Profile | What it tests |
|------|---------|---------------|
| Asian dinner + vegetarian | `dietary: vegetarian` | Respects dietary constraint despite chicken in list |
| Large meal-prep + 1 person | `household_size: 1` | Handles profile-vs-answer conflict (answers say 2 adults) |

### Models tested

| Tier | Model | Approx cost |
|------|-------|-------------|
| Cheap | GPT-5.4 Nano | $0.20/M |
| Cheap | Gemini 2.5 Flash | $0.15/M |
| Mid | GPT-5.4 Mini | $0.75/M |
| Mid | Claude Sonnet 4.5 | $3.00/M |
| Mid | Gemini 2.5 Pro | $1.25/M |

### Assertions per case

- **`is-json`** — validates full `SuggestResponse` schema (reason, clusters, ungrouped, storeLayout)
- **`javascript`** — deterministic structural checks: 2-4 clusters, 3-6 new items, every existing item accounted for, storeLayout completeness
- **`llm-rubric`** (2 judges) — qualitative: cluster coherence, new item relevance, answer/profile respect

## 2. What We Found and How We Improved

### Baseline (v1 prompt): 0% full-pass rate

The original prompt from Phase 3 implementation failed across all 5 models on 40 test runs. We categorized failures into four root causes.

### A. storeLayout incompleteness — models drop items from the store layout

The prompt says "storeLayout must include ALL items" but models consistently omit items. This was the dominant failure across every model and every iteration.

```
// v1 prompt (weak rule)
"storeLayout must include ALL items (existing + new)"

// v2 prompt (explicit step + count instruction)
"4) Store layout — collect EVERY item name from clusters and ungrouped
   (both existing and new). Group them by grocery store aisle.
   The total item count in storeLayout must equal the sum of all
   items in clusters + ungrouped."
```

**Impact**: storeLayout gaps narrowed (off by 1-2 items instead of 5+) but were never fully eliminated. This remained the #1 failure across both iterations. See "Recommendation" below.

### B. Chain-of-thought leakage — models emit "Thinking:" before JSON

Gemini 2.5 Pro was catastrophic in the baseline (0/8, lowest scorer) because it emitted reasoning tokens before the JSON, breaking parsing. Claude Sonnet 4.5 hit this occasionally too.

```
// v1 system prompt (no suppression)
"You are a smart grocery assistant. Respond with JSON only."

// v2 system prompt + user prompt (explicit suppression)
System: "...Respond with JSON only. No markdown, no explanations."
User: "RESPOND WITH ONLY A JSON OBJECT. No explanations, no markdown, no thinking."
```

**Impact**: Fully resolved. Zero "Thinking:" prefix failures after v2.

### C. Meal-only bias — baking lists forced into savory meal clusters

The v1 prompt said "suggest meal ideas" and followed steps like "Recipe bridge — connect existing items into meal clusters." For the baking test case (cookies for kids' birthday), models produced savory meal clusters instead of baking-appropriate suggestions.

```
// v1 prompt (meal-biased)
"...suggest meal ideas..."
"...what's missing for complete meals..."

// v2 prompt (goal-neutral)
"...suggest ideas..."
"...what's missing for complete recipes/preparations..."
```

**Impact**: Fixed for GPT-5.4 Nano and Gemini Flash. Both now produce baking-focused clusters for the cookie case.

### D. Profile context ignored — dietary/household preferences buried

Profile context was appended after the grocery list, easy for models to overlook. Dietary constraints (vegetarian) were partially respected but household size (1 person) was consistently ignored when it conflicted with answers ("2 adults").

```
// v1 prompt (profile after list)
"...suggest ideas.{profile_context}\n\nGrocery list: ..."

// v2 prompt (profile before list, labeled)
"...suggest ideas.\nUser profile (MUST respect): {profile_context}\n\nGrocery list: ..."

// v2 rules (conflict resolution)
"When user profile conflicts with answers, profile takes precedence
 (it represents persistent preferences)"
```

**Impact**: Dietary constraints now respected by most models. Household size conflict still unreliable — models defer to the explicit answer ("2 adults") over the profile ("1 person").

## 3. Results After 2 Prompt Iterations

### Cheap-tier models (used for iteration runs)

| Case | Nano v1 | Nano v2 | Flash v1 | Flash v2 |
|------|---------|---------|----------|----------|
| Asian dinner | FAIL | PASS | FAIL | FAIL |
| Fusion | FAIL | PASS | FAIL | FAIL |
| Baking | FAIL | FAIL | FAIL | PASS |
| Large meal-prep | FAIL | FAIL | FAIL | FAIL |
| No answers | FAIL | FAIL | FAIL | FAIL |
| Minimal | FAIL | FAIL | FAIL | PASS |
| Vegetarian profile | FAIL | FAIL | FAIL | FAIL |
| Single household | FAIL | FAIL | FAIL | FAIL |
| **Total** | **0/8** | **2/8** | **0/8** | **2/8** |

### Baseline results for all 5 models (v1 prompt only)

| Model | Pass/8 | Notes |
|-------|--------|-------|
| Claude Sonnet 4.5 | 1/8 | Best overall score, occasional "Thinking:" prefix |
| GPT-5.4 Mini | 1/8 | Moderate structural compliance |
| GPT-5.4 Nano | 0/8 | Decent JSON but weak on storeLayout |
| Gemini 2.5 Flash | 0/8 | Similar to Nano |
| Gemini 2.5 Pro | 0/8 | Catastrophic — chain-of-thought leakage, truncated outputs |

## 4. Recommendation: Build storeLayout in Code

storeLayout is the single biggest blocker (present in 70%+ of all failures). After 2 iterations, the gap narrowed but was never eliminated — models reliably generate clusters and ungrouped but consistently drop items when constructing storeLayout.

**Proposed fix**: Remove storeLayout from the LLM's responsibility. Instead:

1. Keep the LLM prompt focused on `reason`, `clusters`, and `ungrouped` only
2. After parsing the LLM response, construct `storeLayout` programmatically in `domains.py` by collecting all item names from clusters + ungrouped and grouping by a simple category mapping
3. This eliminates the hardest structural constraint from the LLM, reduces output token count (~30% savings), and makes storeLayout deterministically correct

This is a Phase 4 or Phase 5 task — it requires a category mapping (which aligns with the KB module planned for Phase 4).

### Other remaining gaps

| Gap | Root cause | Suggested fix |
|-----|-----------|---------------|
| Household profile-vs-answer conflict | Models defer to explicit answers over implicit profile | Stronger prompt wording, or preprocess in code to reconcile before sending to LLM |
| "No answers" case → single cluster | Without user context, models produce minimal output | Add a default instruction: "If no user context, suggest 2-3 versatile meal ideas" |
| Gemini Pro unusable for suggest | Chain-of-thought tokens consume output budget, truncation | Drop Gemini Pro from suggest tier, or use with much higher max_tokens |
| Prompt length hurts Nano | Each iteration added rules, Nano regressed on simple cases | Accept Nano is too weak for suggest; route to Mini/Full tier |

### Key insight

The suggest prompt is qualitatively different from the 5 sync endpoints. Those produce small, focused outputs (1 translation, 3-4 alternatives). Suggest produces a large structured response with cross-referencing constraints (every item must appear in exactly one place, storeLayout must mirror clusters+ungrouped). **Cross-referencing constraints are better enforced in code than in prompts.** The LLM should focus on the creative work (clustering, gap analysis) and let deterministic code handle the bookkeeping.
