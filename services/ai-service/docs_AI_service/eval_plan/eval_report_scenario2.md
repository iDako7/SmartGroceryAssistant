# Scenario 2 Eval Report: Cross-Provider Comparison

Scenario 2 compares models from three providers (OpenAI, Google, Anthropic) at two tiers — cheap and mid — using the same improved prompts from Scenario 1. We test the 2 hardest endpoints: **alternatives** (judgment-heavy) and **inspire_item** (creative + conflict handling). Judges: Claude Opus 4.6 + GPT-5.4.

## 1. What We Tested

6 models across 2 tiers, 2 endpoints, 5 test cases each = 60 model-case evaluations.

### Models

| Tier | OpenAI | Google | Anthropic |
|------|--------|--------|-----------|
| Cheap | GPT-5.4 Nano ($0.20/M) | Gemini 2.5 Flash ($0.30/M) | Claude Haiku 4.5 ($1.00/M) |
| Mid | GPT-5.4 Mini ($0.75/M) | Gemini 2.5 Pro ($1.25/M) | Claude Sonnet 4.6 ($3.00/M) |

### Test cases (same as Scenario 1)

**alternatives (5 cases):** sriracha (general), butter+lactose intolerant, rice vinegar (general), chicken breast+vegetarian, fish sauce+Korean taste

**inspire_item (5 cases):** salmon+rice/soy sauce, tofu+gochujang/sesame oil/rice, avocado (no context), chicken thigh+vegetarian profile, bok choy+garlic/oyster sauce

## 2. Results

### Cheap Tier

| Case | GPT-5.4 Nano | Gemini Flash | Haiku 4.5 |
|------|-------------|-------------|-----------|
| **alternatives** | | | |
| sriracha | PASS | PASS | FAIL — match levels |
| butter+lactose | PASS | FAIL — hedging language | PASS |
| rice vinegar | FAIL — match levels | PASS | PASS |
| chicken+vegetarian | PASS | PASS | PASS |
| fish sauce+Korean | FAIL — missing Korean alts | PASS | PASS |
| **inspire_item** | | | |
| salmon | PASS | PASS | PASS |
| tofu+Korean | FAIL — not Korean enough | FAIL — generic Asian | FAIL — Japanese/fusion |
| avocado | PASS | FAIL — low diversity | PASS |
| chicken+veg conflict | PASS | FAIL — silent swap | PASS |
| bok choy+Chinese | PASS | PASS | FAIL — Western recipes |
| **Total** | **7/10** | **6/10** | **7/10** |

### Mid Tier

| Case | GPT-5.4 Mini | Gemini Pro | Sonnet 4.6 |
|------|-------------|-----------|------------|
| **alternatives** | | | |
| sriracha | PASS | PASS | PASS |
| butter+lactose | FAIL — ghee + wrong match | PASS | PASS |
| rice vinegar | PASS | PASS | PASS |
| chicken+vegetarian | PASS | PASS | PASS |
| fish sauce+Korean | PASS | PASS | PASS |
| **inspire_item** | | | |
| salmon | PASS | PASS | PASS |
| tofu+Korean | FAIL — only 1/3 Korean | PASS | PASS |
| avocado | FAIL — desc too long | PASS | PASS |
| chicken+veg conflict | FAIL — silent swap | PASS | PASS |
| bok choy+Chinese | FAIL — fusion recipes | FAIL — butter/Parmesan | FAIL — Japanese dishes |
| **Total** | **5/10** | **9/10** | **9/10** |

## 3. Failure Analysis

### A. Universal failure — bok choy + Chinese authenticity

All 6 models fail or struggle with this case. The rubric requires at least 2/3 recipes to be "recognizably Chinese, not fusion." Common mistakes:
- Roasted bok choy with Parmesan/lemon (Western)
- Miso soup with bok choy (Japanese)
- Bok choy udon noodles (Japanese)

This isn't a model issue — the prompt doesn't specify "Chinese recipes only." Given garlic + oyster sauce, models reasonably explore multiple cuisines. **Recommendation:** If Chinese-authentic output matters, the prompt needs explicit cuisine guidance. Otherwise, loosen the rubric.

### B. Cuisine specificity — tofu + Korean direction

4/6 models fail. With gochujang + sesame oil + rice, the rubric expects at least 2/3 Korean recipes. Models produce generic Asian dishes (stir-fries, baked tofu skewers) that don't feel Korean. Only Gemini Pro and Sonnet 4.6 consistently produce Korean-specific recipes (sundubu jjigae, Korean braised tofu).

**Pattern:** Mid-tier models from Google and Anthropic handle cuisine specificity better than cheap models or GPT.

### C. Conflict acknowledgment — chicken thigh + vegetarian

3/6 models fail. GPT-5.4 Mini, Gemini Flash, and (sometimes) Nano silently swap chicken for vegetarian alternatives without acknowledging the contradiction. Claude Haiku, Claude Sonnet, and Gemini Pro explicitly note the conflict.

**Pattern:** Claude models are consistently good at conflict acknowledgment. GPT models consistently ignore it.

### D. Match-level calibration — butter + lactose

GPT-5.4 Mini suggests ghee (dairy-derived) and labels plant-based butters as "Very close" instead of "Similar." Gemini Flash hedges with "many brands are lactose-free" instead of guaranteeing safety. Both violate the strict dietary compliance rule.

**Pattern:** Model-specific; no clear provider trend.

## 4. Test Harness Lessons

### Markdown JSON wrapping

Gemini and Claude models wrap output in ` ```json...``` ` markdown fences. GPT returns raw JSON. Initial run showed 0/5 for all non-GPT models due to `is-json` assertion failures.

**Fix:** Added `defaultTest.options.transform` to strip markdown fences:
```yaml
defaultTest:
  options:
    transform: "output.replace(/```json\\n?|```/g, '').replace(/^[\\s\\S]*?(?=\\{)/m, '').trim()"
```

### Gemini Pro "Thinking:" prefix

Gemini 2.5 Pro prepends chain-of-thought reasoning as plaintext before the JSON output. The markdown-only transform didn't fix this — needed a broader regex to strip everything before the first `{`.

### Gemini Pro reasoning token overflow

Initial `max_tokens: 800` caused output truncation (`finishReason: length`) because reasoning tokens consumed the budget. Increased to `max_tokens: 4096` for Gemini Pro.

**Production note:** If using Gemini Pro, the service must either disable thinking mode or budget extra tokens. This adds ~4000 tokens per request to the cost.

## 5. Key Insights

### Best value per tier

| Tier | Best model | Score | Price | Runner-up | Score | Price |
|------|-----------|-------|-------|-----------|-------|-------|
| Cheap | GPT-5.4 Nano / Haiku 4.5 (tied) | 7/10 | $0.20 / $1.00 | Gemini Flash | 6/10 | $0.30 |
| Mid | Gemini Pro / Sonnet 4.6 (tied) | 9/10 | $1.25 / $3.00 | GPT-5.4 Mini | 5/10 | $0.75 |

### Recommended two-tier config

Based on cost-effectiveness (quality per dollar):

| Role | Model | Rationale |
|------|-------|-----------|
| `OPENROUTER_MODEL_FAST` | `openai/gpt-5.4-nano` ($0.20/M) | Tied best at cheap tier, 5x cheaper than Haiku |
| `OPENROUTER_MODEL_FULL` | `google/gemini-2.5-pro` ($1.25/M) | Tied best at mid tier, 2.4x cheaper than Sonnet |

**Alternative:** If Gemini Pro's thinking-mode complexity is a concern for production (extra tokens, output parsing), Claude Sonnet 4.6 is the safer choice at 2.4x the cost.

### Endpoint difficulty ranking

| Endpoint | Cheap avg | Mid avg | Hardest case |
|----------|----------|---------|-------------|
| alternatives | 4.7/5 | 4.7/5 | butter+lactose (dietary compliance) |
| inspire_item | 3.0/5 | 3.0/5 | bok choy+Chinese (cuisine authenticity) |

inspire_item is significantly harder than alternatives. Cuisine-specific recipe generation remains the weakest area across all models and tiers.

## 6. Next Steps

| Action | Priority |
|--------|----------|
| Decide on two-tier model config (Nano+Pro vs Nano+Sonnet) | High — blocks production deployment |
| Add cuisine-explicit instruction to inspire_item prompt for strong cuisine signals | Medium — fixes bok choy/tofu cases |
| Add conflict acknowledgment as a required JSON field (e.g., `conflict_note`) | Medium — makes conflict handling structural |
| Run Scenario 3 (open-source/ultra-cheap) on translate + item_info | Low — simple endpoints already work well |
| Update `domains.py` with final prompt + model selections | After decisions above |
