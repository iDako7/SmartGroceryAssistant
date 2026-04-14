# Scenario 3 Eval Report: Open-Source / Ultra-Cheap Models

Scenario 3 tests whether open-source models can replace the Scenario 2 winners at a fraction of the cost. We compare 3 families (Qwen, Llama, DeepSeek) at 2 tiers against the same 2 hardest endpoints. Judges: Claude Opus 4.6 + GPT-5.4.

## 1. What We Tested

6 open-source models across 2 tiers, 2 endpoints, 5 test cases each = 60 model-case evaluations.

### Models


| Tier  | Qwen                       | Llama                      | DeepSeek                |
| ----- | -------------------------- | -------------------------- | ----------------------- |
| Cheap | Qwen 3.5-9B ($0.05/M)      | Llama 4 Scout ($0.08/M)    | DeepSeek V3.1 ($0.15/M) |
| Mid   | Qwen 3.5-35B-A3B ($0.16/M) | Llama 4 Maverick ($0.15/M) | DeepSeek V3.2 ($0.26/M) |


### Baselines (from Scenario 2)


| Tier  | Best model                  | Score | Price           |
| ----- | --------------------------- | ----- | --------------- |
| Cheap | GPT-5.4 Nano                | 7/10  | $0.20/M         |
| Mid   | Gemini 2.5 Pro / Sonnet 4.6 | 9/10  | $1.25 / $3.00/M |


## 2. Results

### Cheap Tier


| Case                 | Qwen 3.5-9B ($0.05) | Llama 4 Scout ($0.08)       | DeepSeek V3.1 ($0.15)      | *Nano baseline* |
| -------------------- | ------------------- | --------------------------- | -------------------------- | --------------- |
| **alternatives**     |                     |                             |                            |                 |
| sriracha             | FAIL — rubric       | FAIL — hallucinated product | PASS                       | *PASS*          |
| butter+lactose       | FAIL — rubric       | FAIL — dietary violation    | FAIL — match inflation     | *PASS*          |
| rice vinegar         | FAIL — JSON parse   | PASS                        | PASS                       | *FAIL*          |
| chicken+vegetarian   | FAIL — JSON parse   | PASS                        | PASS                       | *PASS*          |
| fish sauce+Korean    | FAIL — rubric       | FAIL — weak Korean          | PASS                       | *FAIL*          |
| **inspire_item**     |                     |                             |                            |                 |
| salmon               | FAIL — JSON parse   | PASS                        | FAIL — not Asian enough    | *PASS*          |
| tofu+Korean          | FAIL — rubric       | FAIL — not Korean           | FAIL — not Korean          | *FAIL*          |
| avocado              | FAIL — rubric       | FAIL — low diversity        | PASS                       | *PASS*          |
| chicken+veg conflict | FAIL — JSON parse   | FAIL — JSON + no ack        | FAIL — no conflict ack     | *PASS*          |
| bok choy+Chinese     | FAIL — rubric       | FAIL — Western recipes      | FAIL — Western + 2 recipes | *PASS*          |
| **Total**            | **0/10**            | **3/10**                    | **5/10**                   | ***7/10***      |


### Mid Tier


| Case                 | Qwen 35B-A3B ($0.16) | Llama 4 Maverick ($0.15) | DeepSeek V3.2 ($0.26)             | *Pro baseline* |
| -------------------- | -------------------- | ------------------------ | --------------------------------- | -------------- |
| **alternatives**     |                      |                          |                                   |                |
| sriracha             | PASS                 | FAIL — truncated JSON    | FAIL — self-reference             | *PASS*         |
| butter+lactose       | PASS                 | FAIL — dietary violation | FAIL — match inflation            | *PASS*         |
| rice vinegar         | PASS                 | PASS                     | FAIL — judge disagreement         | *PASS*         |
| chicken+vegetarian   | PASS                 | PASS                     | PASS                              | *PASS*         |
| fish sauce+Korean    | PASS                 | FAIL — weak Korean       | PASS                              | *PASS*         |
| **inspire_item**     |                      |                          |                                   |                |
| salmon               | PASS                 | FAIL — wrong emoji, weak | FAIL — not Asian (borderline)     | *PASS*         |
| tofu+Korean          | FAIL — JSON parse    | FAIL — not Korean        | FAIL — not Korean                 | *PASS*         |
| avocado              | FAIL — JSON parse    | FAIL — low diversity     | FAIL — low diversity (borderline) | *PASS*         |
| chicken+veg conflict | FAIL — JSON parse    | FAIL — no conflict ack   | FAIL — no conflict ack            | *PASS*         |
| bok choy+Chinese     | FAIL — JSON + rubric | FAIL — not Chinese       | FAIL — Western recipes            | *FAIL*         |
| **Total**            | **6/10**             | **2/10**                 | **2/10**                          | ***9/10***     |


## 3. Failure Analysis

### A. Qwen thinking-mode JSON breakage

Both Qwen models use `<think>...</think>` reasoning blocks. Our transform strips these, but it doesn't catch all cases — the tag format varies (sometimes unclosed, sometimes the model emits reasoning without tags). This caused:

- Qwen 9B: 4/10 cases failed on JSON parsing alone
- Qwen 35B: 4/10 inspire_item cases failed on JSON parsing (alternatives was clean 5/5)

**Production impact:** Using Qwen requires either disabling thinking mode or robust server-side parsing. The model's reasoning adds 15,000-20,000 tokens per 5 requests — negating its cost advantage.

### B. Cuisine authenticity — universal weakness

Every open-source model struggles with cuisine-specific recipes:

- **tofu + Korean**: 5/6 models fail. Only Qwen 35B might pass (blocked by JSON issue). Models default to generic Asian stir-fry instead of Korean dishes.
- **bok choy + Chinese**: 6/6 models fail. Olive oil roasting, Parmesan, cream soup — all Western approaches to a Chinese vegetable.
- **fish sauce + Korean**: Cheap models miss guk-ganjang and aekjeot. Only DeepSeek V3.1 and Qwen 35B pass.

**Pattern:** Open-source models have weaker non-Western culinary knowledge than commercial models (Gemini Pro and Sonnet both pass these cases).

### C. Conflict acknowledgment — zero models pass

The chicken thigh + vegetarian case requires the model to explicitly note the contradiction. All 6 open-source models silently swap to vegetarian without acknowledging it. This was also a weakness for GPT models in Scenario 2, but Gemini Pro and Sonnet handle it well.

### D. Dietary safety — inconsistent

Llama models (Scout and Maverick) suggest generic "Margarine" for lactose intolerant without verifying dairy-free. DeepSeek models suggest safe alternatives but mis-label match levels. Qwen 35B gets this right (passes butter+lactose).

## 4. Test Harness Lessons

### `<think>` tag stripping

Added `output.replace(/<think>[\\s\\S]*?<\\/think>/g, '')` to the transform. This fixed most cases but not all — Qwen sometimes emits reasoning without proper closing tags, or uses different delimiters. A more aggressive approach (strip everything before first `{`) was already in the chain but doesn't catch text *after* the JSON.

### Reasoning token overhead

Qwen models consume 15,000-20,000 reasoning tokens per 5 requests. At $0.05/M, this makes Qwen 9B's effective cost ~$1/M when including reasoning tokens — **5x more expensive than advertised** and comparable to Haiku 4.5.

## 5. Key Insights

### Cheap tier — no viable replacement for Nano


| Model         | Total    | Input $/M | Effective $/M* | vs Nano (7/10, $0.20)  |
| ------------- | -------- | --------- | -------------- | ---------------------- |
| DeepSeek V3.1 | **5/10** | $0.15     | $0.15          | 29% cheaper, 29% worse |
| Llama 4 Scout | 3/10     | $0.08     | $0.08          | 60% cheaper, 57% worse |
| Qwen 3.5-9B   | 0/10     | $0.05     | ~$1.00         | Broken (thinking mode) |


*Effective $/M includes reasoning token overhead for thinking models.

**Verdict:** No open-source cheap model matches Nano's quality. DeepSeek V3.1 is the closest at 5/10 but still 2 points behind on the same test cases. **Keep Nano as FAST model.**

### Mid tier — Qwen 35B is promising but unreliable


| Model            | Total    | Input $/M | Effective $/M* | vs Pro (9/10, $1.25)    |
| ---------------- | -------- | --------- | -------------- | ----------------------- |
| Qwen 3.5-35B-A3B | **6/10** | $0.16     | ~$1.50         | Similar cost, 33% worse |
| DeepSeek V3.2    | 2/10     | $0.26     | $0.26          | 79% cheaper, 78% worse  |
| Llama 4 Maverick | 2/10     | $0.15     | $0.15          | 88% cheaper, 78% worse  |


**Qwen 35B scored 5/5 on alternatives** (matching Gemini Pro and Sonnet) but 1/5 on inspire_item (mostly JSON issues). If the JSON parsing is fixed, its real quality could be 7-8/10 — competitive with Gemini Pro at 8x lower base price. However, reasoning tokens inflate the effective cost to ~$1.50/M, making it comparable to Pro.

**Verdict:** No open-source mid model reliably matches Gemini Pro. **Keep Gemini Pro as FULL model** (or Sonnet 4.6 if thinking-mode complexity is a concern).

## 6. Final Model Recommendations (All 3 Scenarios)


| Role                    | Model              | Score | Price   | Rationale                                                      |
| ----------------------- | ------------------ | ----- | ------- | -------------------------------------------------------------- |
| `OPENROUTER_MODEL_FAST` | **GPT-5.4 Nano**   | 7/10  | $0.20/M | Best cheap model; no open-source competitor matches quality    |
| `OPENROUTER_MODEL_FULL` | **Gemini 2.5 Pro** | 9/10  | $1.25/M | Tied with Sonnet at 2.4x less cost; handles conflict + cuisine |
| Alternative FULL        | Claude Sonnet 4.6  | 9/10  | $3.00/M | Safer (no thinking-mode parsing); 2.4x more expensive          |


### What open-source is good for

- **DeepSeek V3.1** ($0.15/M) scored 4/5 on alternatives — could work for the alternatives endpoint specifically if cost pressure is extreme
- **Qwen 3.5-35B** scored 5/5 on alternatives — best alternative score of any model, but JSON reliability blocks production use

### Next steps


| Action                                                                                         | Priority |
| ---------------------------------------------------------------------------------------------- | -------- |
| Set `OPENROUTER_MODEL_FAST=openai/gpt-5.4-nano`, `OPENROUTER_MODEL_FULL=google/gemini-2.5-pro` | High     |
| Update `domains.py` with final improved prompts from Scenario 1                                | High     |
| Add cuisine-explicit instruction to inspire_item prompt (fix bok choy/tofu cases)              | Medium   |
| Add `conflict_note` field to inspire_item JSON schema                                          | Medium   |
| Consider endpoint-specific model routing (DeepSeek for alternatives only)                      | Low      |


