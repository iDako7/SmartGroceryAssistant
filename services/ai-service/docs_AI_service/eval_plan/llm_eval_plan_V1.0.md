# AI Service — LLM Evaluation Plan

**Last updated:** 2026-03-31
**Owner:** Dako (@iDako7)
**Status:** Planning. Not yet implemented.

**Purpose:** Establish a systematic PDCA loop for evaluating and improving prompt quality, model selection, and cost efficiency across all AI Service endpoints.

---

## Goals

Two fixed goals drive this plan. The path to achieve them is flexible — adapt the progression as you learn.

1. **Prompt quality:** How much does score improve when prompts are optimized? (Bad prompt → current prompt → optimized prompt)
2. **Model cost-effectiveness:** What's the quality-to-cost ratio across models? Does paying 2x get meaningfully better output, or can cheap models handle simple tasks?

---

## Tools

| Tool          | Purpose                                                                | When to use                                                                     |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **promptfoo** | Prompt eval: quality scoring, model comparison, cost tracking per call | After every prompt or model change                                              |
| **k6**        | Load testing: latency, throughput, backpressure                        | After architectural changes (cache, async pipeline, broker swap) — Phase B only |

These are separate tools solving separate problems. promptfoo measures output quality + cost. k6 measures system performance under load. They don't combine.

---

## Phase A — LLM Evaluation

### A.1 Experiment Design

#### The Matrix

Every endpoint is evaluated across two dimensions: **prompt quality** × **model capability**.

|                     | Current prompt            | Optimized V1                  | Optimized V2               |
| ------------------- | ------------------------- | ----------------------------- | -------------------------- |
| **Cheap model**     | baseline                  | first improvement (cheap)     | second improvement (cheap) |
| **Expensive model** | current state (expensive) | first improvement (expensive) | best possible              |

What this matrix reveals:

- **Row difference** (same model, different prompts) = value of each round of prompt optimization
- **Column difference** (same prompt, different models) = value of paying more for a better model
- **Diminishing returns** = if V1→V2 gains are small, stop optimizing and focus on model selection instead

#### Model Comparison Framework — Three Scenarios

Each scenario answers a different business question. Run them as a funnel — narrow down before expanding.

**Scenario 1 — Same provider, different tiers**

Compare two models from the same company. Cleanest comparison — same API format, same tokenizer, only capability differs.

Purpose: "Is the price jump within this provider's lineup worth it?"

| Tier        | Recommended placeholder                 | Notes                                         |
| ----------- | --------------------------------------- | --------------------------------------------- |
| Lightweight | `[ANTHROPIC_FAST]` — e.g., Haiku class  | Simple tasks: translate, item-info            |
| Advanced    | `[ANTHROPIC_FULL]` — e.g., Sonnet class | Complex tasks: alternatives, inspire, clarify |

> **All model names are placeholders.** Verify current availability and pricing on OpenRouter before running evals.

**Scenario 2 — Cross-provider, same tier**

Compare the latest models across major providers at equivalent tiers.

Purpose: "Who gives the best quality-to-cost ratio at each capability level?"

| Provider  | Lightweight placeholder | Advanced placeholder |
| --------- | ----------------------- | -------------------- |
| Anthropic | `[ANTHROPIC_FAST]`      | `[ANTHROPIC_FULL]`   |
| OpenAI    | `[OPENAI_FAST]`         | `[OPENAI_FULL]`      |
| Google    | `[GOOGLE_FAST]`         | `[GOOGLE_FULL]`      |

Don't test all models on all endpoints. Test lightweight models on simple endpoints (translate, item-info). Test advanced models on complex endpoints (clarify, inspire). Use Scenario 1 results to guide where to focus.

**Scenario 3 — Open-source / ultra-cheap models**

Test whether budget models can handle simple tasks acceptably.

Purpose: "Can I use a model at 1/10th the cost for straightforward endpoints?"

| Candidate placeholder   | Notes                                                   |
| ----------------------- | ------------------------------------------------------- |
| `[QWEN_CANDIDATE]`      | Alibaba's Qwen series — strong multilingual, very cheap |
| `[DEEPSEEK_CANDIDATE]`  | DeepSeek series — competitive pricing                   |
| `[OTHER_OSS_CANDIDATE]` | Llama, Mistral, etc. — check OpenRouter for latest      |

Only test on endpoints where Scenario 2 already showed cheap models perform acceptably. If Haiku-class scores 9/10 on translate, no need to test 5 more cheap models on the same endpoint.

**This directly feeds your two-tier model config:** `OPENROUTER_MODEL_FAST` might end up being an open-source model for simple tasks, while `OPENROUTER_MODEL_FULL` stays with Claude or GPT for complex ones.

#### Avoiding Combinatorial Explosion

The funnel approach:

1. Scenario 1: 2 models × 5 endpoints × 3 prompt tiers = 30 runs → pick tier insight
2. Scenario 2: 6 models × targeted endpoints only (not all 5) → pick provider
3. Scenario 3: 2-3 cheap models × only endpoints where cheap works → finalize FAST model

---

### A.2 Test Fixtures

#### Case Count

5 cases per endpoint. At least 2 should be genuinely tricky for the domain.

#### Two User Types

This app serves a diverse Vancouver market — fixtures must cover both directions:

1. **Immigrant/international user** exploring Western grocery items (e.g., translating "cream cheese" for a Chinese newcomer, finding alternatives to ranch dressing)
2. **Local Canadian** exploring Asian/Mexican/Indian items (e.g., translating "豆腐乳" to English, getting info on jicama, finding alternatives for gochujang)

Every endpoint's fixture set should include cases from both user types.

#### Fixture Examples by Endpoint

**translate (5 cases)**

| #   | Input                      | Direction                                    | Why it's in the set                                                                        |
| --- | -------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | `chicken breast` → Chinese | Immigrant direction                          | Simple baseline — should be trivial for any model                                          |
| 2   | `enoki mushroom` → Chinese | Immigrant direction                          | Multiple valid translations (金针菇 vs 金菇), tests grocery-specific term selection        |
| 3   | `豆腐乳` → English         | Local exploring Asian food                   | Culturally specific, no single perfect English equivalent                                  |
| 4   | `jicama` → Chinese         | Cross-cultural                               | Mexican ingredient, less common in Chinese cooking, tests whether notes field adds context |
| 5   | `cream cheese` → Chinese   | Immigrant direction, with vegetarian profile | Profile should influence notes (e.g., mention plant-based alternatives)                    |

**item_info (5 cases)**

| #   | Input                        | User type               | Why it's in the set                                                       |
| --- | ---------------------------- | ----------------------- | ------------------------------------------------------------------------- |
| 1   | `chicken thigh`              | Either                  | Simple baseline                                                           |
| 2   | `gai lan` (Chinese broccoli) | Local exploring         | Tests recognition of transliterated names, accurate category              |
| 3   | `cotija cheese`              | Local exploring Mexican | Less mainstream, tests knowledge depth                                    |
| 4   | `rice paper`                 | Either                  | Ambiguous — could be craft supply or food, tests grocery context          |
| 5   | `Costco rotisserie chicken`  | Either                  | Costco-specific item, tests whether response addresses bulk/store context |

**alternatives (5 cases)**

| #   | Input           | Reason                                          | Why it's in the set                                                             |
| --- | --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | `soy sauce`     | "allergic to soy"                               | Dietary constraint — alternatives must actually be soy-free                     |
| 2   | `paneer`        | "" (no reason)                                  | Tests alternatives without explicit reason — should infer based on availability |
| 3   | `Sriracha`      | "can't find it at Costco"                       | Store availability — alternatives should be bulk-store friendly                 |
| 4   | `shaoxing wine` | "don't want alcohol"                            | Cultural + dietary — tests match level accuracy                                 |
| 5   | `masa harina`   | "" with profile: `taste: "Korean home cooking"` | Profile-influenced — should suggest Korean-cuisine-compatible alternatives      |

**inspire_item (5 cases)**

| #   | Input           | Other items                   | Why it's in the set                                                                  |
| --- | --------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| 1   | `salmon`        | `rice, soy sauce`             | Simple, clear direction                                                              |
| 2   | `tofu`          | `gochujang, sesame oil, rice` | Korean direction obvious — tests if recipes respect it                               |
| 3   | `avocado`       | none                          | No context — recipes should be diverse                                               |
| 4   | `chicken thigh` | `tortillas, cilantro, lime`   | Mexican direction obvious, with vegetarian profile — tests profile conflict handling |
| 5   | `bok choy`      | `garlic, oyster sauce`        | Local exploring Chinese — recipes should be authentic, not fusion-ified              |

**clarify (5 cases)**

| #   | Input (sections)                                                                                              | Why it's in the set                                                                |
| --- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | `{"produce": ["lettuce", "tomato", "onion"], "protein": ["chicken breast"]}`                                  | Simple, clear — should generate only 1 question                                    |
| 2   | `{"produce": ["bok choy", "cilantro", "jalapeño"], "protein": ["pork belly", "shrimp"]}`                      | Mixed cuisine signals (Chinese + Mexican) — should ask about cuisine intent        |
| 3   | `{"snacks": ["chips", "dip", "beer", "hot dogs"], "produce": ["watermelon"]}`                                 | Party obvious — question should confirm scale/occasion, not cuisine                |
| 4   | `{"produce": ["garlic", "ginger", "scallion"], "protein": ["beef"], "dairy": ["butter", "cream"]}`            | Ambiguous — Asian aromatics + Western dairy — should ask 2-3 questions             |
| 5   | `{"produce": ["potato", "carrot", "celery"], "protein": ["whole chicken"]}` with profile: `household_size: 6` | Large household — question should address batch cooking / meal prep vs single meal |

---

### A.3 Evaluation Criteria

#### Per-Endpoint Assertions

Every endpoint gets layered assertions: deterministic checks first (free, instant), then semantic checks (costs tokens).

**translate**

```yaml
assert:
  - type: is-json
  - type: javascript
    value: |
      const d = JSON.parse(output);
      d.name_translated && d.name_translated.length > 0
  - type: llm-rubric
    value: >
      Translation is accurate for grocery/cooking context.
      If multiple valid translations exist, the most commonly used
      grocery or cooking term is preferred.
      Notes field provides useful context when the translation has
      nuance (e.g., regional variants, alternative names).
      Empty notes is acceptable when the translation is unambiguous.
```

**item_info**

```yaml
assert:
  - type: is-json
  - type: javascript
    value: |
      const d = JSON.parse(output);
      d.category && d.typical_unit && d.storage_tip && d.nutrition_note
  - type: llm-rubric
    value: >
      All four fields are factually accurate and specific to this item.
      Category is a standard grocery department (produce, dairy, etc.).
      Storage tip is actionable and practical for a home kitchen.
      Nutrition note highlights the single most relevant nutritional
      characteristic, not a generic statement.
```

**alternatives**

```yaml
assert:
  - type: is-json
  - type: javascript
    value: |
      const d = JSON.parse(output);
      d.alts && d.alts.length >= 3 && d.alts.length <= 4 &&
      d.alts.every(a => a.name_en && a.match && a.desc && a.where)
  - type: llm-rubric
    value: >
      Alternatives are genuinely available in North American grocery
      stores (Costco, Walmart, T&T, H-Mart, etc.).
      Match levels are honest:
        - "Very close" = functionally interchangeable in most recipes
        - "Similar" = same category, noticeable difference
        - "Different but works" = creative substitution
      If user provided a reason (allergy, availability, preference),
      ALL alternatives must respect that constraint.
      "where" field gives a useful aisle or store hint, not just
      "grocery store."
```

**inspire_item**

```yaml
assert:
  - type: is-json
  - type: javascript
    value: |
      const d = JSON.parse(output);
      d.recipes && d.recipes.length === 3 &&
      d.recipes.every(r => r.name && r.emoji && r.desc && r.add && r.add.length >= 2 && r.add.length <= 3)
  - type: llm-rubric
    value: >
      Recipes are practical home cooking, not restaurant complexity.
      Each recipe genuinely uses the focal item as a key ingredient,
      not a garnish or optional topping.
      Missing ingredients (add items) are NOT already in the user's
      other_items list.
      If user has taste preferences in profile, recipes should lean
      toward those cuisines without being exclusively limited to them.
      Descriptions are max 8 words and genuinely descriptive.
```

**clarify**

```yaml
assert:
  - type: is-json
  - type: javascript
    value: |
      const d = JSON.parse(output);
      d.questions && d.questions.length >= 1 && d.questions.length <= 3 &&
      d.questions.every(q => q.q && q.options && q.options.length >= 3 && q.options.length <= 4)
  - type: llm-rubric
    value: >
      Questions are specific to the actual grocery list provided,
      not generic questions that could apply to any list.
      The NUMBER of questions adapts to complexity:
        - Obvious list (clear single cuisine or purpose) = 1 question
        - Mixed signals or ambiguous scale = 2-3 questions
      Options are short enough for tappable UI chips (2-5 words each).
      Questions feel conversational, like a friend asking
      "what are we cooking?" — not an interrogation or survey.
```

#### Judge Model Configuration

Use two judge models for initial calibration:

```yaml
# promptfooconfig.yaml
defaultTest:
  options:
    provider:
      - id: "[JUDGE_MODEL_A]" # Recommended: Claude Sonnet class
      - id: "[JUDGE_MODEL_B]" # Recommended: GPT-4o class
```

> Placeholder — verify model availability on OpenRouter.

Run both judges on the same outputs in the first eval run. If they agree directionally (both rank prompt A > prompt B), drop one for subsequent runs to save cost. If they disagree, tighten the rubric — the disagreement means the rubric is ambiguous.

**Important:** The judge model must be at least as capable as the model being tested. Never use a cheap model to judge an advanced model's output.

---

### A.4 Prompt Versions

Three prompt tiers form the rows of the evaluation matrix:

**Current prompt** — what's in `domains.py` today. Snapshot before any changes. This is the baseline.

**Optimized V1** — first round of targeted improvements:

1. Run baseline eval with current prompt
2. Identify the 2-3 worst-scoring cases
3. Diagnose why they failed (rubric mismatch? structural issue? factual error?)
4. Modify prompt to address those specific failures
5. Re-run eval — check if fixed cases improved without regressing others

**Optimized V2** — second round, building on V1:

1. Run eval on V1 prompt
2. Identify remaining weak spots or new patterns
3. Refine further — may include structural changes (reordering instructions, adding constraints, tightening output format)
4. Re-run eval
5. If V1→V2 improvement is within noise (±0.3 on 0-10 scale), stop — further optimization has diminishing returns

> Additional rounds (V3, V4...) are possible but unlikely to be worthwhile. The matrix is designed to show when to stop.

---

### A.5 Recommended Progression

These are suggested phases, not rigid steps. Adapt based on what you learn. The goals remain fixed.

**Phase 1 — Learn the tool**

- Pick one endpoint: `translate` (simplest input/output)
- 5 test cases
- `is-json` + one `llm-rubric` assertion
- Two providers from Scenario 1 (e.g., `[ANTHROPIC_FAST]` + `[ANTHROPIC_FULL]`)
- One prompt tier (current prompt only)
- Goal: get promptfoo running, see the comparison UI, understand the output

**Phase 2 — Build the matrix**

- Same endpoint, run current prompt as baseline
- Optimize to V1, then V2
- Run full matrix: 3 prompt tiers × 2 models = 6 combinations
- Add both judge models, compare their agreement
- Start the decision log
- Goal: see the prompt × model interaction, decide if prompt or model matters more for this endpoint

**Phase 3 — Expand and compare**

- Add remaining endpoints with their fixtures and rubrics
- Run Scenario 2 (cross-provider comparison) on targeted endpoints
- Run Scenario 3 (open-source models) where cheap models looked promising
- Goal: have quality + cost data for every endpoint × model combination that matters

**Phase 4 — Lock in decisions**

- Finalize model selection for `OPENROUTER_MODEL_FAST` and `OPENROUTER_MODEL_FULL`
- Final prompt versions committed to `domains.py`
- Full eval snapshot saved as regression baseline
- Goal: no more open questions about prompt quality or model selection

---

### A.6 Decision Log

Track every change and its measured impact. This prevents going in circles.

| Date      | Change                                              | Endpoint     | Quality delta  | Cost delta   | Decision                          |
| --------- | --------------------------------------------------- | ------------ | -------------- | ------------ | --------------------------------- |
| _example_ | Changed inspire prompt to include cuisine context   | inspire_item | +1.6 (6.2→7.8) | +$0.001/call | Keep                              |
| _example_ | Switched translate to Qwen                          | translate    | -0.2 (8.9→8.7) | -80% cost    | Keep — negligible quality loss    |
| _example_ | Added "respond as grocery expert" role to item_info | item_info    | +0.1 (7.5→7.6) | same         | Revert — not worth the complexity |

---

### A.7 Cost of Running Evals

The eval itself costs money (LLM calls for both the tested model and the judge model). Strategies to manage this:

- **promptfoo caches by default** (14-day TTL) — re-running the same eval with the same inputs costs nothing
- **Use `--no-cache` only when you need fresh outputs** (new prompt version, new model)
- **Funnel approach reduces combinations** — don't test every model on every endpoint
- **Drop to one judge model after Round 1** if judges agree
- **Track eval cost separately** — know how much you're spending on testing vs. on actual usage

---

## Phase B — System-Level Testing

> **Timing:** Phase B starts after the async pipeline (Celery + workers) exists — Phase 3 of the phased implementation plan. There's nothing meaningful to load test until then.

### B.1 What to Measure

| Metric                             | Why it matters                                       |
| ---------------------------------- | ---------------------------------------------------- |
| P95 latency under concurrent users | Users won't wait 8 seconds in-store                  |
| Cache hit rate impact on latency   | Validates the 70% KB/cache target                    |
| Celery queue depth under load      | Detect backpressure before it becomes UX degradation |
| Timeout/retry behavior             | What happens when OpenRouter is slow?                |
| Error rate under sustained load    | Does the system degrade gracefully?                  |

### B.2 Tool

k6 — lightweight, JS-scriptable, clean percentile reports.

### B.3 When to Run

- After adding Redis cache (does cache actually reduce latency?)
- After adding KB tier (does KB serve requests faster than LLM?)
- After implementing Celery async pipeline (does it handle concurrent suggest/inspire jobs?)
- After broker swap experiment (Redis vs RabbitMQ comparison)

Load test results feed back into the decision log alongside prompt eval data.

---

## File Structure (Proposed)

```
services/ai_service/
  tests/
    eval/
      promptfooconfig.yaml          # Main config — providers, prompts, test refs
      fixtures/
        translate_cases.yaml
        item_info_cases.yaml
        alternatives_cases.yaml
        inspire_item_cases.yaml
        clarify_cases.yaml
      prompts/
        bad/                        # Minimal prompts for baseline comparison
        current/                    # Snapshot of domains.py prompts at eval start
        optimized/                  # Improved versions after iteration
      DECISION_LOG.md               # Track every change and its impact
```

---

## Open Questions

| ID   | Question                                                        | When to resolve                                     |
| ---- | --------------------------------------------------------------- | --------------------------------------------------- |
| EQ-1 | Which specific models to use for each placeholder?              | Phase 1 — check OpenRouter availability and pricing |
| EQ-2 | Which judge model(s) to use? Confirm API key availability.      | Phase 1 — before first eval run                     |
| EQ-3 | Should promptfoo eval run in CI on PRs that touch `domains.py`? | After Phase 4 — when regression baseline exists     |
| EQ-4 | k6 script scope — which endpoints to load test first?           | Phase B — after async pipeline is built             |
