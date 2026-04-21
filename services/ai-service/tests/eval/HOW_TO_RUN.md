# How to Run the Eval Tests

## Prerequisites

1. **Node.js** (you already have this from the web project)
2. **OpenRouter API key** in `services/ai-service/.env` (already there)

## Run All 5 Endpoints

```bash
cd services/ai-service/tests/eval
TS=$(date +%Y%m%d_%H%M%S)
for cfg in configs/*.yaml; do
  name=$(basename "$cfg" .yaml)
  npx promptfoo@latest eval -c "$cfg" --env-file ../../.env --no-cache \
    -o "results/scenario1_${name}_${TS}.yaml" \
    -o "results/scenario1_${name}_${TS}.csv"
done
```

This runs **50 total calls** (5 endpoints x 5 test cases x 2 models) plus judge calls.
Output: YAML (for agent) + CSV (for human) per endpoint, all with the same timestamp.

## Run a Single Endpoint

```bash
npx promptfoo@latest eval -c configs/translate.yaml --env-file ../../.env --no-cache \
  -o "results/scenario1_translate_$(date +%Y%m%d_%H%M%S).yaml" \
  -o "results/scenario1_translate_$(date +%Y%m%d_%H%M%S).csv"
```

Replace `translate` with: `item_info`, `alternatives`, `inspire_item`, or `clarify`.

## View Results in Browser

```bash
npx promptfoo@latest view
```

Opens UI at `http://localhost:15500`. Use `Cmd+K` to switch between eval runs.

## Config & Cost

- 2 tested models: GPT-5.4 Nano ($0.20/M) and GPT-5.4 Mini ($0.75/M)
- 2 judge models: Claude Sonnet 4.6 and GPT-5.4 Mini (for llm-rubric scoring)
- Estimated cost: ~$0.05-0.10 per endpoint, ~$0.25-0.50 for all 5

## File Structure

```
tests/eval/
  configs/              # One config per endpoint
    translate.yaml
    item_info.yaml
    alternatives.yaml
    inspire_item.yaml
    clarify.yaml
  prompts/current/      # Chat-format prompts (JSON)
  fixtures/             # Test cases with assertions (YAML)
  results/              # Timestamped output files
```

## Endpoints at a Glance

| Endpoint | Tier | Cases | Models | What it tests |
|----------|------|-------|--------|---------------|
| translate | fast | 5 | 2 | Multilingual accuracy, regional variants |
| item_info | fast | 5 | 2 | Factual accuracy, actionable tips |
| alternatives | full | 5 | 2 | Dietary constraints, match honesty |
| inspire_item | full | 5 | 2 | Cuisine direction, profile conflicts |
| clarify | full | 5 | 2 | Adaptive question count, conversational tone |
| suggest | full | 8 | 5 | Meal clustering, gap analysis, store layout, profile constraints |

## Re-run After Changes

Re-run with the same commands above. Each run creates timestamped files for comparison.

## Troubleshooting

- **"API key not found"**: Make sure `OPENROUTER_API_KEY` is in `../../.env` or exported in your shell
- **Model not available**: Check model availability at openrouter.ai/models
- **Timeout**: Add `--timeout 60000` flag for slower models
- **Don't use multiple `-c` flags in one command** — it creates a cross-product matrix instead of isolated suites
