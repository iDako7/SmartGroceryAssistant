# Scenario 1 Eval Report: Prompt Improvement Experiment

Scenario 1 compares two OpenAI models on OpenRouter — GPT-5.4 Nano ($0.20/M) vs GPT-5.4 Mini ($0.75/M) — using the same prompt, across all 5 sync endpoints. We ran 4 prompt versions, each evaluated with `is-json` schema checks, `javascript` structural assertions, and `llm-rubric` quality scoring (judged by Claude Sonnet 4.6 + GPT-5.4 Mini).

## 1. What We Tested

25 test cases across 5 endpoints, each targeting a specific quality dimension:

### translate (5 cases)
| Case | What it tests |
|------|--------------|
| milk → Chinese | Basic translation of a common item |
| cilantro → Chinese | Regional naming (香菜 vs 芫荽) |
| chicken thigh → Korean | Compound item with cut-specific terminology |
| baking soda → French | Easily confused counterpart (baking soda vs baking powder) |
| bok choy → Chinese | Reverse-loanword item with multiple Chinese names |

### item_info (5 cases)
| Case | What it tests |
|------|--------------|
| banana | Standard produce with obvious storage/nutrition |
| gochujang | Fermented condiment with opened-vs-unopened storage difference |
| quinoa | Pseudocereal with a distinctive nutritional trait (complete protein) |
| tofu | Plant protein with specific storage needs (submerge in water) |
| saffron | Expensive spice sold in tiny quantities with specific storage |

### alternatives (5 cases)
| Case | What it tests |
|------|--------------|
| sriracha | Match-level honesty — alternatives should not be "Very close" unless same product |
| butter + lactose intolerant | Dietary constraint enforcement — every alternative must be safe |
| rice vinegar | General substitution with no constraints |
| chicken breast + vegetarian | Dietary override — all alternatives must be plant-based, match levels honest |
| fish sauce + Korean taste | Cuisine-appropriate alternatives (should suggest Korean condiments) |

### inspire_item (5 cases)
| Case | What it tests |
|------|--------------|
| salmon + rice/soy sauce | Japanese-direction recipes; added items must not overlap user's list |
| tofu + gochujang/sesame oil/rice | Korean-themed recipes using the focal item |
| avocado + no other items | Recipe diversity — must span different cooking styles |
| chicken thigh + vegetarian profile | Dietary conflict handling — must acknowledge chicken vs vegetarian |
| bok choy + garlic/oyster sauce | Chinese-direction recipes with appropriate extra ingredients |

### clarify (5 cases)
| Case | What it tests |
|------|--------------|
| chicken, rice, soy sauce | Obvious Asian meal — should ask exactly 1 question |
| tortillas, cheese, kimchi, naan | Mixed cuisines — should ask 2-3 questions about the ambiguity |
| chips, soda, cups, napkins | Obvious party list — should ask exactly 1 question |
| flour, sugar, butter, eggs, vanilla | Obvious baking — should ask exactly 1 question |
| salmon, steak, shrimp, lobster + butter, cream | Ambiguous scale — should ask about occasion/number of people |

## 2. What We Found and How We Improved

We categorize all failures into three root causes using MECE grouping. Each was addressed with a targeted prompt fix.

### A. Factual specificity — model output is correct but too vague

The model gives generic answers where the user needs specific, actionable detail. This affected **item_info** (storage tips, nutrition notes) and **translate** (disambiguation).

**Representative example: gochujang storage tip**

The original prompt produced `"storage_tip": "Refrigerate after opening"` — technically correct but unhelpful. The user needs to know gochujang is shelf-stable *unopened* (cool pantry) but must be refrigerated *opened*.

```
// v1 prompt (vague)
"ONLY JSON: {\"storage_tip\": \"...\"}"

// v3 prompt (specific guidance)
"storage_tip: distinguish opened vs unopened if different.
 nutrition_note: lead with the item's most distinctive trait.
 ONLY JSON: {\"storage_tip\": \"...\"}"
```

**Impact**: item_info Nano improved 3/5 → 5/5. The two added instruction lines fixed gochujang (opened/unopened), quinoa (now leads with "complete protein"), and saffron (now uses standard category name "Spices").

### B. Judgment calibration — model misjudges similarity or safety

The model labels alternatives as "Very close" when they're clearly different products, or suggests items that may violate dietary restrictions. This was the **alternatives** endpoint's biggest problem.

**Representative example: butter + lactose intolerant**

Nano suggested `"Kerrygold Butter (Lactose-Free or Lactose-Reduced option if available)"` with the caveat "if available" — unacceptable for a dietary restriction where every suggestion must be definitively safe.

```
// v1 prompt (no dietary guidance)
"Find 3-4 alternatives for \"{{name_en}}\" ...
 ONLY JSON: {\"alts\": [...]}"

// v3 prompt (strict rules)
"If a dietary restriction is given, EVERY alternative MUST be
 definitively compliant — no \"if available\" or \"check label\" items.
 match levels (use strictly): \"Very close\" = same product,
 different brand. Different product type = \"Similar\" at best."
```

**Impact**: alternatives Nano improved 1/5 → 3/5. The chicken-breast+vegetarian case (was suggesting meat with "Very close") and fish-sauce+Korean case (was missing Korean-specific condiments like 새우젓) both fixed. Mini jumped to 5/5 — it follows calibration instructions more reliably than Nano.

### C. Instruction compliance — model ignores explicit constraints

The model receives a clear rule but doesn't follow it. This affected **clarify** (question count) and **inspire_item** (dietary conflict acknowledgment).

**Representative example: clarify over-asking on obvious lists**

For `["flour", "sugar", "butter", "eggs", "vanilla"]`, the original prompt generated 2-3 questions despite saying "If straightforward, generate just 1 question." The model treated the soft wording as a suggestion, not a rule.

```
// v1 prompt (soft wording)
"If straightforward, generate just 1 question.
 If ambiguous or complex, generate 2-3."

// v3 prompt (strict rule + negative instruction)
"QUESTION COUNT (follow strictly):
 - All items clearly point to ONE purpose (Asian meal, baking,
   party snacks) → EXACTLY 1 question. Do NOT add follow-up
   questions about servings or spice level.
 - Items span multiple cuisines or occasion is genuinely
   unclear → 2-3 questions about the ambiguity."
```

**Impact**: clarify Nano fixed the flour/baking case (v1: 2 questions → v3: 1 question) and the chicken/rice/soy case. However, chips/soda and salmon/steak remain unreliable — Nano struggles with question-count compliance even with strict wording.

## 3. What Still Needs Improvement

### Results after 4 prompt iterations

| Endpoint | Nano v1 → best | Mini v1 → best |
|----------|----------------|----------------|
| translate | 4/5 → **5/5** | 4/5 → **5/5** |
| item_info | 3/5 → **5/5** | 2/5 → **4/5** |
| alternatives | 1/5 → **3/5** | 2/5 → **5/5** |
| inspire_item | 3/5 → **3/5** | 3/5 → **3/5** |
| clarify | 3/5 → **2/5** | 2/5 → **3/5** |
| **Total** | **14 → 18** | **13 → 20** |

### Remaining gaps and next steps

| Gap | Root cause | Suggested fix |
|-----|-----------|---------------|
| **alternatives Nano** (sriracha match level, butter safety) — 2 failures | Nano lacks judgment precision for "Very close" vs "Similar" calibration | Accept as model-tier limitation, or route alternatives to Mini/Full tier |
| **inspire_item conflict handling** (chicken + vegetarian) — both models | Models silently adapt without acknowledging the conflict; hard to steer via prompt alone | Add a `conflict_note` field to the JSON schema so the model has a dedicated place to flag it |
| **inspire_item non-determinism** (salmon, bok choy fluctuate) | LLM output variance between runs | Run each case 3x and use majority-vote pass; or loosen rubric thresholds on borderline cases |
| **clarify question count** (chips/soda, salmon/steak) — Nano only | Nano ignores strict counting rules even with emphasis | Route clarify to Mini tier (already 3/5 → likely 4-5/5 with further tuning), or add few-shot examples |

### Key insight

Mini benefits significantly more from prompt improvements than Nano. From v1 → v2, Mini jumped 13 → 20 (+7) while Nano stayed at 14. For endpoints requiring judgment (alternatives, clarify), **using Mini is more cost-effective than further prompt engineering on Nano**.
