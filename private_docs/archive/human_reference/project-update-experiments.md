# Project Update: Smart Grocery Assistant — AI-Powered Shopping with Tiered Inference

## 1. Experiments

We run three experiments targeting the three core technical claims of the project: that structured AI reasoning produces better suggestions, that tiered local inference is worth the complexity, and that the async job pipeline holds under real load.

### Experiment 1: Prompt Complexity vs. Suggestion Quality

Compare the current flat-list prompt ("suggest 5–10 items the user might need") against a structured 3-step reasoning chain (gap analysis → cultural match → recipe bridge), as specified in the PRD. Measure suggestion relevance via blind human rating (1–5), redundancy rate (how often the AI suggests something already on the list), and recipe cluster coherence.

**Why:** The entire Smart View UX — clustered recipe suggestions, context blocks, Keep/Dismiss — depends on the AI returning structured, meaningful output. The current prompt is a placeholder. This experiment validates whether the added prompt complexity actually produces better output or whether it's wasted token cost. We expect structured reasoning to score higher on cultural fit but run slower; this trade-off determines which prompt ships.

### Experiment 2: Tiered Inference — Local KB vs. Cloud

Build a local SQLite knowledge base covering 50 common Costco products (Tier 1). Route Item Info, Alternatives, and Translation requests through the tier selector: Tier 0 (local dictionary) → Tier 1 (SQLite KB) → Tier 2 (cloud LLM). Measure: % of requests served without a cloud call, p50/p99 latency per tier, and token cost per session.

**Why:** The entire offline architecture depends on this working. If 70%+ of requests can be served locally, the app is viable in-store under poor connectivity. If local hit rate is low, the SQLite KB strategy needs rethinking before mobile development begins. The control baseline is the current system (100% cloud). This also directly tests the project's most novel engineering claim.

### Experiment 3: Async Suggestion Pipeline Under Concurrent Load

Load test the RabbitMQ → AI worker → Redis → poll chain at 1, 5, and 20 concurrent users. Measure: end-to-end latency from POST `/suggest` to first polled result, queue depth growth, and worker error rate.

**Why:** Currently the system runs one worker. If two users request suggestions simultaneously, jobs queue up and both see slow responses. This experiment finds the breaking point and answers whether horizontal worker scaling is needed before the app goes public. CPU-bound inference is unlike typical web request load — queue depth, not request rate, is the right metric.

---

## 2. Value Beyond AI

AI tools generated boilerplate and explained concepts. Here is what required us:

**Microservices integration debugging.** The RabbitMQ worker silently drops jobs when Redis is unreachable. The WebSocket relay in the Gateway connects to a non-existent List Service endpoint. PostgreSQL soft-delete queries silently include deleted items when the JOIN order is wrong. These bugs are invisible to AI — they only surface when running the full stack locally and reading actual logs.

**Knowledge base curation.** Deciding which products belong in Tier 1 (e.g., "enoki mushrooms" needs cultural context; "apple" does not), writing bilingual mappings for Costco-specific products, and defining aisle layout data for the in-store mode requires judgment about the actual user — new immigrants navigating a North American bulk store — that no AI can replicate.

**Experiment design.** Choosing what to hold constant across experiments (same user profile, same initial list, same LLM temperature) to produce interpretable results requires understanding how each variable affects the system. The uniform-profile control in Experiment 1 exists because cultural match scores are meaningless without a stable persona.

**UX trade-off decisions.** The PRD specifies that tiered inference must be transparent to the user. Deciding when a 600ms Tier 1 response is acceptable vs. when it should fall through to cloud requires product judgment about what "feels instant" in-store — something only the team can evaluate hands-on.

**Honest negative results.** If the 3-step reasoning chain shows no improvement over the flat prompt, we will report it and ship the simpler prompt. We commit to what the data says, not what looks good.

---

## 3. Timeline

| Week | Focus | Deliverable |
|---|---|---|
| 1 (Mar 22–28) | Tiered inference infrastructure | Tier selector logic, SQLite KB with 50 products, Tier 0 local dictionary, all wired into AI Service |
| 2 (Mar 29–Apr 4) | 3-step reasoning chain + response format | Structured prompt implemented, recipe cluster response format, Experiment 1 data collected (flat vs. structured, N=30 rated outputs) |
| 3 (Apr 5–11) | Load testing + tiered inference A/B | Experiment 3 results (latency curves at 1/5/20 users), Experiment 2 results (hit rate, latency, cost per tier), charts generated |
| 4 (Apr 12–18) | Polish + writeup | Final analysis, clean repo, demo video, report submitted |
