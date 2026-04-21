# CS6650 Final Project — Group Submission

**Project:** Smart Grocery — An AI-Powered Grocery Shopping Assistant
**Team:** Dako (Qi Wei, @iDako7), Sylvia (Kaiyue Wei, @KaiyueWei), William (Xing, @William-g7)
**Repo:** [Smart Grocery Assistant](https://github.com/iDako7/SmartGroceryAssistant)

> Reminder: each team member uploads this same package to their own Canvas submission.

---

## 1. Video (5 marks)

Screen-capture walkthrough, 2–3 minutes per member. No AI voiceovers.

| Member          | Topic / Scope                                                                                                                             | Video link                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| William         | API Gateway (Fastify) + Frontend (Next.js) — Gateway load-test experiment, two-step AI suggest UI, Prometheus integration                | [Video Link](https://www.loom.com/share/7c44a48f07bc4acaa69237e78c7cf20d) |
| Sylvia (Kaiyue) | User Service + List Service (Go/Gin) — User Service load test, concurrent-write and cross-DB ownership experiments, RabbitMQ outbox/saga | [Video Link](https://drive.google.com/file/d/1DNVzvWq1GKMZPbbU_xRkT-FonKbSqTtA/view?usp=sharing) |
| Dako            | AI Service (Python/FastAPI) + AI Worker — three-tier pipeline (Cache → KB → LLM), circuit breaker, Celery async flow                   | [Video Link](https://drive.google.com/file/d/19145hE0hM5wKQEfUPOFzukt2KPjsd3sP/view?usp=sharing)                                                                       |

---

## 2. Code (5 marks)

**Primary repo:** [Smart Grocery Assistant](https://github.com/iDako7/SmartGroceryAssistant)

**What the project is and why we built it:**

> Smart Grocery helps new immigrants navigate bulk stores like Costco — they know the dishes they want to cook but not which products to buy, which aisles to find them in, or what substitutes exist when an ingredient is unavailable. General-purpose LLMs can answer these questions but cost 2–5s and per-token fees per query, which is impractical for in-store use. Smart Grocery combines a curated knowledge base (Costco products, recipe-ingredient maps, bilingual names) with tiered inference (Redis cache → SQLite KB → LLM), aiming to serve 70%+ of requests without a cloud LLM call.

**Individual activity links:**

- William: [Commit History](https://github.com/iDako7/SmartGroceryAssistant/commits/main/?author=William-g7)
- Sylvia: [Commit History](https://github.com/iDako7/SmartGroceryAssistant/commits/main/?author=KaiyueWei)
- Dako: [Commit History](https://github.com/iDako7/SmartGroceryAssistant/commits/main/?author=iDako7)


**Evidence of activity along the way:**

- Commit history on `main` and feature branches (`feat/<service>/<desc>`)
- Merged PRs (link the PR list filtered by author per member)
- CI runs (`.github/workflows/ci.yml`) — path-based detection, gate job `ci-pass`
- Homework checkpoints under `docs/homework/HW_*` showing weekly progress

---

## 3. Project Management (5 marks)

### 3.1 Problem breakdown

Problem: new immigrants in bulk stores need product discovery, aisle help, and substitute suggestions. General LLMs are too slow/expensive for per-item in-store use.

MVP decisions:

- Polyglot microservices behind a single API Gateway (decomposition by domain)
- Two separate PostgreSQL databases (`user_db`, `list_db`) — database-per-service for independence
- AI as a **last resort**, not default: Redis cache → SQLite KB → LLM tier routing
- Async pipeline (Celery) for long-running AI calls; sync for fast ones
- Observability-first: every service exposes Prometheus `/metrics`, shared naming convention `smartgrocery_{service}_{metric}_{unit}`

### 3.2 Ownership matrix

| Area                                           | Owner           | Scope                                                                                                             |
| ---------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| Frontend (Next.js / React)                     | William         | Onboarding flow, per-item AI panels, suggest → clarify → smart/store view, Lucide icons, 85% test coverage      |
| API Gateway (Fastify)                          | William         | JWT auth, CORS, rate limit (100/min), proxying, Prometheus metrics, load tests                                    |
| User Service (Go/Gin)                          | Sylvia (Kaiyue) | Registration, login, JWT issuance, dietary profile, load test baseline                                            |
| List Service (Go/Gin)                          | Sylvia (Kaiyue) | Sections/items CRUD, soft deletes, ownership enforcement, RabbitMQ event publishing, saga + transactional outbox  |
| AI Service (Python/FastAPI)                    | Dako            | Three-tier pipeline, translate / item-info / alternatives / inspire / suggest / clarify endpoints, JWT middleware |
| AI Worker (Celery)                             | Dako            | OpenRouter calls, Redis result store, circuit breaker                                                             |
| Infra (Docker / RabbitMQ / Postgres / Grafana) | Shared          | Docker Compose stack, Grafana auto-provisioning, CI path-based detection                                          |

### 3.3 Timeline (from HW_9 progress report)

| Week | Milestone                                                  | Status                                     |
| ---- | ---------------------------------------------------------- | ------------------------------------------ |
| 1    | Service interfaces defined, Docker Compose infra setup     | Done                                       |
| 2    | API Gateway core routing + JWT auth                        | Done                                       |
| 3    | User Service + List Service CRUD endpoints                 | Done                                       |
| 4    | CI/CD — unit tests, linting, path-based detection         | Done                                       |
| 5    | AI Service sync endpoints + Redis cache                    | Done                                       |
| 6    | Frontend MVP + Prometheus metrics + Gateway load tests     | Done                                       |
| 7    | KB module (SQLite + FTS5), circuit breaker, async pipeline | Done — Phase 3 async pipeline + eval suite shipped; KB module + circuit breaker deferred to Phase 4/5 |
| 8    | Metrics instrumentation + Grafana dashboards               | Done                                     |
| 9    | Experiments execution (all three with API key)             | Done — Phase A LLM evals executed (Scenarios 1–3 + suggest iteration); Phase B load testing deferred |
| 10   | Final report + presentation                                | In progress                                |

### 3.4 Problems encountered & how we solved them

- **Distributed consistency for user deletion** — synchronous cross-service cascade risked partial failure. Chose saga + transactional outbox over 2PC; events published from `list_db` in the same transaction as local writes, consumed asynchronously via RabbitMQ. See `services/list-service/experiments/saga-benchmark/`.
- **Cross-database ownership enforcement** — no FK possible between `user_db` and `list_db`. Enforced in application code (JWT + `sections.user_id` JOIN) and validated under load in Experiment 2b.
- **LLM cost & latency** — 2–5s per Claude call and per-token cost made per-item UX infeasible. Solved via tier routing (Cache → KB → LLM) + circuit breaker. Projected 70%+ of requests served without LLM.
- **Bcrypt CPU bottleneck under load** — User Service login/register latency climbed from ~70ms (100u) to 1.6s avg (1000u). Measured and documented; mitigations (hash cost tuning / caching) pushed to future work.
- **AI Service failing in Gateway load tests** — 100% failure rate caused by missing OpenRouter API key in CI. Confirmed that Gateway itself remains healthy; AI path isolated.
- **CI flakiness on shared paths** — resolved via CODEOWNERS updates and lint-staged pre-commit.

### 3.5 Coordination tools

- GitHub Issues + PRs + CODEOWNERS-driven review [Github CI](https://github.com/iDako7/SmartGroceryAssistant/tree/main/.github/workflows)

---

## 4. Experiments (10 marks) — to be exported as ≤5 page PDF

Code for every experiment lives under `services/<svc>/experiments/` or `services/<svc>/locust/`.

### Experiment 1 — API Gateway Throughput & Per-Service Latency (William)

**Code:** [`services/api-gateway/locust/locustfile.py`](https://github.com/iDako7/SmartGroceryAssistant/blob/main/services/api-gateway/locust/locustfile.py)
**Full report:** [`services/api-gateway/locust/load_test.md`](https://github.com/iDako7/SmartGroceryAssistant/blob/main/services/api-gateway/locust/load_test.md)
**Screenshots & HTML results:** [`services/api-gateway/locust/screenshots/`](https://github.com/iDako7/SmartGroceryAssistant/tree/main/services/api-gateway/locust/screenshots) and [`services/api-gateway/locust/results/`](https://github.com/iDako7/SmartGroceryAssistant/tree/main/services/api-gateway/locust/results)
**Metrics instrumentation:** [`services/api-gateway/src/plugins/metrics.ts`](https://github.com/iDako7/SmartGroceryAssistant/blob/main/services/api-gateway/src/plugins/metrics.ts)
**Grafana dashboard:** [`infra/grafana/dashboards/gateway-overview.json`](https://github.com/iDako7/SmartGroceryAssistant/blob/main/infra/grafana/dashboards/gateway-overview.json)

- **Purpose / tradeoff:** The API Gateway adds an extra network hop and JWT validation to every request. We wanted to answer: does this proxy layer add meaningful latency vs. direct service access? And which downstream service becomes the bottleneck first under concurrent load?

- **Setup:** Locust load tests targeting `localhost:3001` (API Gateway), 60-second runs at 1, 5, 20, and 50 concurrent users. Each virtual user simulates a realistic flow: register → profile read/write → list CRUD → AI item-info → health check bursts. Prometheus scrapes the Gateway's `/metrics` endpoint (custom metrics: `http_request_duration_seconds`, `gateway_upstream_duration_seconds`, `gateway_upstream_errors_total`, `gateway_in_flight_requests`, `rate_limit_hits_total`). A Grafana dashboard auto-provisioned via `infra/grafana/` visualizes request rate, latency percentiles, and per-service upstream breakdown in real time.

- **Results:**

| Users | RPS  | Avg (ms) | p95 (ms) | p99 (ms) | Failure % |
| ----- | ---- | -------- | -------- | -------- | --------- |
| 1     | 1.3  | 17.18    | 61       | 420      | 6%        |
| 5     | 5.9  | 9.36     | 21       | 100      | 27%       |
| 20    | 18.1 | 6.16     | 12       | 57       | 29%       |
| 50    | 28.1 | 4.82     | 10       | 33       | 18%       |

Per-service p95 at 50 users: Gateway-only `/health` 7ms (stable); User Service `GET /me` 10ms, `POST /register` 110ms (bcrypt CPU-bound); List Service `GET /full` 11ms, `DELETE` 7ms; AI Service `item-info` 42ms (100% failures — no API key configured). Full per-route breakdown with Grafana screenshots available in [`services/api-gateway/locust/screenshots/`](https://github.com/iDako7/SmartGroceryAssistant/tree/main/services/api-gateway/locust/screenshots).

- **Analysis:** The Gateway is definitively **not** the bottleneck — the `/health` endpoint (pure Gateway, no upstream) stays at 3–5ms median regardless of concurrency. Throughput scales linearly from 1.3 to 28.1 RPS across 1→50 users with no degradation cliff. The AI Service is an order of magnitude slower than other services and the sole source of functional errors, confirming it as the correct target for circuit-breaker protection. User registration (bcrypt) is the slowest write path at 97–110ms. The Go-based List Service is the fastest downstream at 5–13ms for all operations.

- **Limitations:** Single-machine Docker Compose (no network latency between services); 50-user ceiling (not production-scale); AI Service failures are artificial (missing API key, not service instability); some failures at 5+ users are caused by Locust concurrent-register JWT timing collisions, not real auth failures.

### Experiment 2a — Concurrent Write Serialization on List Service (Sylvia)

**Code:** `services/list-service/locust/` + verification script — [Experiment Report](../../services/list-service/locust/locust_test.md)

- **Purpose / tradeoff:** Does PostgreSQL row-level locking + application transaction handling correctly serialize concurrent writes to the same list section without lost updates, duplicate items, or phantom entries? What's the latency cost of contention?
- **Setup:** Pre-seed one section with 10 items. Spawn N concurrent writers (1, 5, 10) doing interleaved PATCH + POST + DELETE loops. Reconcile final `list_db` state against per-client operations log.
- **Baseline (completed) — User Service load test, Go/Gin + PostgreSQL, 1-min runs:**

| Users | Agg RPS | Agg Median | Agg Avg | Failures |
| ----- | ------- | ---------- | ------- | -------- |
| 100   | 29.9    | 3ms        | 25.6ms  | 0        |
| 500   | 146.1   | 2ms        | 190ms   | 0        |
| 1000  | 288.8   | 7ms        | 930ms   | 0        |

Bcrypt (login/register) is the bottleneck — avg climbs from 70ms → 1.6s. Reads stay fast at median (1–2ms) but queue behind bcrypt at 1000u. Zero failures at any tier; service degrades gracefully.

- **Results (pending List Service run):** _Pending final List Service write-contention run; baseline User Service numbers above stand as reference._
- **Analysis:** _To be finalized after the List Service writer run; hypothesis: PostgreSQL row-level locking serializes writes cleanly with latency growth at 10 concurrent writers._
- **Limitations:** Single-machine Docker Compose, synthetic workload, no explicit `SELECT ... FOR UPDATE` yet.

### Experiment 2b — Cross-Database Ownership Enforcement Under Load (Sylvia)

**Code:** `services/list-service/experiments/saga-benchmark/` — [Experiment Report](../../services/list-service/experiments/saga-benchmark/distributed-consistency-layers.md)

- **Purpose / tradeoff:** Shared database vs. database-per-service. With `user_db` and `list_db` separate, ownership must be enforced in application code (JWT + section JOIN). Does that hold under concurrent access? What's the eventual-consistency gap when a user is deleted mid-flight?
- **Setup:** 5 users in `user_db`, each owning 2 sections in `list_db`. 80% legitimate requests, 20% cross-user attempts (different JWT → someone else's sections). Concurrency 1/5/10, 60s runs. Verify no unauthorized write succeeded and no legitimate owner was rejected.
- **Trade-off matrix (from HW_9):**

| Dimension                | Shared DB          | DB-per-Service (chosen)            |
| ------------------------ | ------------------ | ---------------------------------- |
| Referential integrity    | Native FK          | App-level JWT + JOIN               |
| Cross-service queries    | Single JOIN        | Two queries or trust JWT           |
| Service coupling         | Shared schema      | Full isolation                     |
| Independent scaling      | Shared pool        | Independent                        |
| Failure isolation        | Both fail together | User DB down → degraded but alive |
| Eventual-consistency gap | N/A                | Orphaned list data on user delete  |

- **Saga/outbox result:** chosen to close the eventual-consistency gap — User Service publishes `user.deleted` via transactional outbox → RabbitMQ → List Service consumes and soft-deletes. _See_ `services/list-service/experiments/saga-benchmark/` _for throughput and latency detail._
- **Analysis:** JWT-based ownership enforcement held across 1/5/10 concurrent-user runs with 20% cross-user attempts; the saga + transactional outbox mitigated the user-delete race without a two-phase commit.
- **Limitations:** JWT statelessness means a revoked user's token remains valid until expiry; saga closes the data gap but not the auth gap.

### Experiment 3 — LLM Model Selection & Prompt-Iteration Quality (Dako)

**Code:** `services/ai-service/tests/eval/` (promptfoo configs + fixtures) · reports under `services/ai-service/docs_AI_service/eval_plan/`

- **Purpose / tradeoff:** Does cheap-tier LLM routing (GPT-5.4 Nano at $0.20/M, Gemini 2.5 Flash at $0.15/M) deliver acceptable quality across our six AI endpoints versus mid-tier (GPT-5.4 Mini $0.75/M, Claude Sonnet 4.5 $3.00/M, Gemini 2.5 Pro $1.25/M)? Where do ultra-cheap open-source alternatives (Qwen, Llama, DeepSeek) fit on the cost/quality curve?
- **Setup:**
  - **Scenario 1** (same-provider tier): 5 sync endpoints × 5 test cases = 25 cases, GPT-5.4 Nano vs GPT-5.4 Mini, 4 prompt iterations.
  - **Scenario 3** (open-source comparison): 6 OSS models × 2 hardest endpoints × 5 cases = 60 model-case runs against Nano/Pro baselines.
  - **Suggest endpoint**: 5 models × 8 test cases × 2 prompt iterations (v1 → v2).
  - Pair-of-judges rubric (Claude Sonnet 4.6 + GPT-5.4 Mini in Scenario 1; Claude Opus 4.6 + GPT-5.4 in Scenario 3) to mitigate single-grader bias.
  - Assertion stack per case: `is-json` schema → `javascript` structural checks → `llm-rubric` quality score.
- **Results:**

| Scenario | Key finding | Numbers |
| --- | --- | --- |
| Scenario 1 (Nano vs Mini) | Cheap tier matches mid on same provider | Nano 0.887 avg / 14-pass; Mini 0.860 avg / 13-pass out of 25 |
| Scenario 3 (OSS cheap) | No OSS cheap model beats Nano | Ceiling DeepSeek V3.1 5/10; Qwen 3.5-9B 0/10 (JSON parse); Llama 4 Scout 3/10 |
| Suggest v1 → v2 | Two prompt bugs fixed; one structural bug remains | v1 0/40 full-pass; v2 fixed thinking-prefix leak (100%) + meal-bias (for Nano/Flash); storeLayout gap persists |

**Final model selection:** `OPENROUTER_MODEL_FAST = GPT-5.4 Nano` ($0.20/M), `OPENROUTER_MODEL_FULL = Gemini 2.5 Pro` ($1.25/M) — 3.75× cheaper on the fast tier than a Mini-default baseline.

- **Analysis:** Same-provider cheap-tier parity (Nano ≈ Mini) empirically justifies tier routing by endpoint complexity rather than by uniform model choice. The suggest endpoint result is a structural finding: `storeLayout` accounting cannot be fixed by prompt alone and needs a post-LLM reconciliation pass in code — the experiment drove an architectural decision, not just a prompt change. The pair-of-judges rubric exposed single-judge bias (Claude judges over-penalized GPT outputs), and cross-provider judging is now the default for quality evals.
- **Limitations:** `llm-rubric` scores are stochastic (~±5% across runs). Phase B tier-hit-rate load testing (Cache → KB → LLM) was deferred because the KB module is not yet live. Cost figures reflect OpenRouter list price; real markup not measured.
- **References:** `eval_report_scenario1.md`, `eval_report_scenario3.md`, `eval_report_suggest_endpoint.md`, and `llm_eval_plan_V1.0.md` under `services/ai-service/docs_AI_service/eval_plan/`.

### PDF export checklist

- [ ] ≤5 pages
- [ ] Purpose / results / analysis / limitations for each experiment
- [ ] Charts: Gateway throughput curve, User Service latency-vs-load, tier hit-rate bar chart
- [ ] Experiment code paths linked inline

---

## 5. Community Contributions (5 marks)

Piazza post under **Final Projects** with our video + experiments PDF, plus 3 comparison links.

**Our Piazza post URL:** `<!-- TODO -->`

**Three related projects (from HW_9 §4.3 — already drafted):**

| # | Project                                                                                             | Found by | Most similar because…                                                                                                | Key difference                                                                                                                                                           | What we learned                                                                                                                |
| - | --------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 1 | Real-Time Distributed Microservices Monitoring & Alerting (Kafka + Prometheus + Grafana on AWS ECS) | William  | Microservices + async messaging + Prometheus/Grafana observability; both evaluate horizontal scalability              | Their core data pipeline**is** the monitoring platform (Kafka-centric); we are an end-user app where monitoring is supplementary; they have no AI                  | Experiment isolation matters: running consumer-rebalancing and end-to-end alert-latency tests in sequence can conflate effects |
| 2 | Terraform MCP for MCP-Compliant AI Providers (Team 42)                                              | Dako     | Both insert a structured knowledge/context layer between user request and LLM to avoid hallucinations and token waste | They surface**live, mutable** cloud state; our KB is **curated, read-only**, updated offline. They have no caching layer                                     | Pre-retrieval grounding is a cross-cutting pattern — our caching + their live MCP are two points on the same spectrum         |
| 3 | Measuring the Real Cost and Recovery of Splitting a Monolith                                        | Sylvia   | Go microservices + Redis + Locust + structured logging + correlation IDs                                              | They run a**controlled** monolith-vs-microservice measurement on a single boundary; we assume microservices from the start and build features across four services | They produce the empirical baseline we cite implicitly when we claim DB-per-service has ops cost                               |

---

## 6. Lessons Learned — **Individual** (separate Canvas submission)

Each member submits their own reflection (see `docs/group_submission/individual_submission.md`). Not part of this shared doc.

| Member  | Draft location    | Status                           |
| ------- | ----------------- | -------------------------------- |
| William | `docs/group_submission/individual_submission_Xing.md` | Final |
| Sylvia  | `docs/group_submission/individual_submission_kaiyue.md` | Final |
| Dako    | `docs/group_submission/individual_submission_dako.md` | `draft` |

---

## Submission checklist (per member on Canvas)

- [ ] Video link (combined or per-member)
- [ ] Repo link + README ready
- [ ] Project management artifact (this doc or a linked board)
- [ ] Experiments PDF (≤5 pages) attached
- [ ] Piazza post URL with 3 comparisons
- [ ] Individual lessons-learned reflection (separate submission)
