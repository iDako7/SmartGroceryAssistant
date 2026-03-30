\*\*# Smart Grocery: An AI-Powered Grocery Shopping Assistant

CS 6650 — Scalable Distributed SystemsTeam Members: Dako (Qi Wei), Kaiyue (Sylvia), William (Xing)

Date: Mar 29, 2026

---

## 1. Problem, Team, and Overview of Experiments

### 1.1 Problem Statement

New immigrants navigating bulk stores like Costco face a specific challenge: they know what dishes they want to cook, but not which products to buy, which aisles to find them in, or what substitutes exist when a familiar ingredient is unavailable. General-purpose AI assistants (ChatGPT, Claude) can answer these questions, but at a cost — each query takes 2–5 seconds and incurs per-token charges, making them impractical for per-item, in-store use.

Smart Grocery addresses this by combining a curated domain knowledge base (Costco products, recipe-ingredient mappings, bilingual names) with tiered inference: Redis cache first, SQLite KB second, LLM last. The goal is to serve 70%+ of requests without a cloud LLM call, making AI-assisted grocery planning fast enough to use while shopping and cheap enough to run at scale.

### 1.2 Team Introduction

Dako (Qi Wei) — AI Service (Python/FastAPI, OpenRouter API). Responsible for the three-tier inference pipeline (Cache → KB → LLM), Knowledge Base module (SQLite + FTS5), Celery async worker, and all AI endpoints (translate, item-info, alternatives, inspire, suggest, clarify).

Kaiyue (Sylvia) — User Service + List Service (Go/Gin). Responsible for user registration, JWT issuance, dietary profiles, and all shopping list CRUD operations (sections, items, soft deletes, ownership enforcement).

William (Xing) — API Gateway (Node.js/Fastify) + Frontend (Next.js/React). Responsible for JWT auth enforcement, rate limiting, HTTP proxying, Prometheus metrics integration, and the full web UI including the two-step AI suggest flow and per-item AI panels.

### 1.3 Overview of Experiments

Three experiments, one per service owner:

**Experiment 1 (William — Gateway):** Gateway throughput and per-service latency under increasing concurrency (1, 5, 20, 50 users). Evaluates whether the Gateway itself becomes a bottleneck and which downstream service limits system throughput.

**Experiment 2 (Sylvia — User/List Service):** Concurrent write consistency under simultaneous list edits. Evaluates whether the database layer correctly serializes concurrent writes and whether cross-database user ownership checks hold under load.

**Experiment 3 (Dako — AI Service):** Tier routing effectiveness — cache hit rate, per-tier latency distribution, and estimated cost savings vs. a pure-LLM baseline. Evaluates whether the three-tier architecture delivers its promised speed and cost benefits.

The three experiments together trace the full request path: Gateway overhead → service throughput → AI cost efficiency.

### 1.4 Role of AI

AI plays two roles in Smart Grocery.

As a product feature, the AI Service calls OpenRouter (Claude API) to generate grocery suggestions, item education content, recipe ideas, and bilingual translations. These are the features users interact with directly — AI-powered per-item info, alternatives, and full list suggestions.

The key design decision is that the LLM is the last resort, not the default. The tier routing pipeline (Cache → KB → LLM) ensures that repeated or common queries are served from Redis or SQLite, with the LLM invoked only for novel requests. The target is 70%+ of requests served without a cloud LLM call.

As a development tool, the team uses Claude Code for infrastructure scaffolding, debugging Docker networking issues, and drafting course deliverables.

### 1.5 Observability Plan

Each service exposes a `/metrics` endpoint in Prometheus format. Metrics follow a shared naming convention: `smartgrocery_{service}_{metric}_{unit}`.

Key metrics per service:
- **Gateway**: `smartgrocery_gateway_request_duration_seconds` (labeled by route and upstream service), `smartgrocery_gateway_requests_total` (labeled by status code), `smartgrocery_gateway_inflight_requests`
- **AI Service**: `smartgrocery_ai_tier_hits_total` (labeled by tier: cache/kb/llm), `smartgrocery_ai_llm_duration_seconds`, `smartgrocery_ai_circuit_breaker_state` (0=closed, 1=open)
- **User/List Services**: `smartgrocery_db_query_duration_seconds`, `smartgrocery_http_requests_total`

Grafana dashboards are auto-provisioned from `infra/grafana/provisioning/`. Alerting targets: LLM error rate > 20% (triggers circuit breaker review), Gateway p99 > 500ms, DB query p95 > 100ms.

---

## 2. Project Plan and Recent Progress

### 2.1 Timeline

| Week    | Milestone                                                     | Status         |
| ------- | ------------------------------------------------------------- | -------------- |
| Week 1  | Service interfaces defined, Docker Compose infra setup        | ✅ Done        |
| Week 2  | API Gateway core routing + JWT auth complete                  | ✅ Done        |
| Week 3  | User Service + List Service CRUD endpoints                    | ✅ Done        |
| Week 4  | CI/CD pipeline — unit tests, linting, path-based detection    | ✅ Done        |
| Week 5  | AI Service sync endpoints + Redis cache layer                 | ✅ Done        |
| Week 6  | Frontend MVP + Prometheus metrics + Gateway load tests        | ✅ Done        |
| Week 7  | KB module (SQLite + FTS5), circuit breaker, async pipeline    | 🔄 In Progress |
| Week 8  | Metrics instrumentation complete + Grafana dashboards live    | 🔄 In Progress |
| Week 9  | Experiments execution (all three experiments with API key)    | ⬜ Planned     |
| Week 10 | Final report + presentation                                   | ⬜ Planned     |

### 2.2 Task Breakdown

Dako:

Completed:
- Built AI Service FastAPI application (main.py, config, middleware)
- Implemented Redis cache layer with TTL-based invalidation (TTL=3600s)
- Integrated OpenRouter API via `openai` Python SDK (base URL override)
- Built three sync endpoints: `/translate`, `/item-info`, `/alternatives`
- JWT verification middleware (`app/middleware/auth.py`) — defense in depth alongside Gateway
- Job polling endpoint (`GET /api/v1/ai/jobs/:id`) — reads from Redis result store
- CI integration: ruff lint + format check, pytest in GitHub Actions

Next:
- Implement SQLite Knowledge Base (FTS5 full-text search, 3-5 cuisines, 50 Costco products)
- Add circuit breaker to LLM calls (fail-fast when OpenRouter error rate exceeds threshold)
- Wire Celery async pipeline for suggest/inspire endpoints
- Configure API key in test env and run full tier routing experiment
- Add Prometheus metrics counters per tier (cache hits, KB hits, LLM calls)

Sylvia:

Completed:
- User Service: registration, login, JWT issuance, profile management with dietary preferences
- List Service: sections and items CRUD, soft deletes, user ownership enforcement via section JOIN
- RabbitMQ event publishing from List Service
- Load tests for User Service (results in `services/user-service/locust/load_test.md`)
- Documented two-database trade-off (separate DBs for service independence vs. single DB for FK integrity)

Next:
- Run concurrent write consistency experiment
- Wire User Service events to downstream consumers via RabbitMQ
- Add Prometheus metrics to both Go services

William:

Completed:
- Built onboarding flow (5-step profile setup) and profile editing page
- Added per-item AI buttons (Info, Alternatives, Inspire) with inline expandable panels
- Implemented Suggest → Clarifying Questions → Smart View / Store View toggle (full two-step suggest flow with mock data)
- Replaced all emoji with Lucide React SVG icons for consistent, professional UI
- Aligned all AI response types with MVP-PRD schemas (ItemInfo, Alternatives, Inspire, Suggest, Clarify)
- Integrated Prometheus metrics into API Gateway (request latency, upstream breakdown by service, error rate, in-flight requests, rate limiting)
- Set up Prometheus scraping for all services + Grafana dashboard auto-provisioning
- Ran Gateway load tests at 1/5/20/50 concurrent users; Gateway overhead <8ms, linear scaling to 28 RPS
- Raised web test coverage from 61% to 85% (52 tests)
- Fixed CI: CODEOWNERS shared paths, Prettier formatting, vitest config

Next:
- Integrate clarifying questions and suggest endpoints with real AI Service API (pending teammate's implementation)
- Enable E2E (Playwright) tests in CI pipeline
- Add Docker image build + push to GHCR in CI
- Run extended load tests (100+ users) with AI Service API key configured

### 2.3 AI in Development Process

AI plays two distinct roles in this project: as a product feature and as a development tool.

As a product feature, the AI Service calls the Claude API to generate grocery suggestions, item education, and recipe-based recommendations. This is the core differentiator of Smart Grocery and is discussed in detail in Section 5.4 (Dako's experiment design).

As a development tool, the team uses AI assistance across three areas:

Code generation and scaffolding. Claude Code (CLI) accelerates boilerplate-heavy work — Terraform configurations, Docker Compose service definitions, Locust test scripts, and proto file stubs. Rather than writing gRPC service definitions from scratch, we describe the interface contract and iterate on the generated output. This is most effective for infrastructure code where the patterns are well-established.

Debugging and troubleshooting. Claude Code in AWS CloudShell helps diagnose deployment issues — parsing CloudWatch logs, identifying region mismatches, and tracing ECS task failures. For local development, it assists with Docker networking issues and cross-service communication debugging.

Documentation and reporting. Course deliverables (this report, Piazza posts, presentation scripts) are drafted with AI assistance for structure and English prose, then reviewed and edited by team members for accuracy and voice.

Cost-benefit assessment:

The primary benefit is velocity. Infrastructure scaffolding that would take hours of documentation-reading takes minutes. The team estimates AI tooling saves roughly 30-40% of development time on boilerplate and debugging tasks.

The primary cost is over-reliance risk. AI-generated code that "looks right" can mask misunderstandings — for example, a Terraform configuration that deploys successfully but with incorrect security group rules. The mitigation is mandatory code review: no AI-generated code merges without a team member understanding every line. A second cost is API expense for the product-facing AI features, which is addressed through tiered caching and circuit breaker gating (see Section 3.4).

---

## 3. Objectives

### 3.1 Short-Term Objectives (Within Course)

- Complete KB module: SQLite database with 3-5 cuisines and 50 Costco products, seeded offline, deployed as `.db` file alongside AI Service
- Wire circuit breaker to LLM calls: fail fast at 20% error rate, recover after 30s
- Connect Celery async pipeline for suggest and per-list inspire endpoints
- Run all three defined experiments and collect complete latency/throughput/cost data
- Deploy full monitoring stack (Prometheus + Grafana) with all services instrumented

### 3.2 Long-Term Objectives (Beyond Course)

- Production deployment on Kubernetes (Tilt dev environment already configured as precursor)
- Expand KB to 10+ cuisines and 200+ products with community-contributed data
- Multi-user real-time list collaboration via CRDT-based sync (OR-Set for items, LWW-Register for metadata)
- Mobile app (React Native / Expo) with offline-first support — sync on reconnect
- Expanded AI capabilities: meal planning across multiple weeks, dietary tracking, budget-aware suggestions

### 3.3 Future Work

Observability long-term: extend Prometheus metrics to include business-level signals — KB hit rate trend over time (signals when KB needs refresh), LLM cost per user per day (triggers budget alerts), and cache eviction rate (signals TTL misconfiguration). Add distributed tracing (OpenTelemetry) to correlate Gateway request IDs through to LLM calls.

Knowledge Base expansion: current SQLite + FTS5 approach works for read-heavy, single-node deployment. At scale, migrate to a vector database (pgvector or Pinecone) for semantic ingredient matching — enabling "find substitutes for this item" without exact string match.

Eventual consistency gap: if User Service deletes a user while List Service is unavailable, orphaned list data persists. Requires a cleanup job or event-driven saga pattern via RabbitMQ dead-letter queue.

### 3.4 AI Performance, Reliability, and Cost Control

**Performance:** LLM calls target <3s p95 response time. Cache layer (Redis, TTL=3600s) and KB layer (SQLite FTS5, ~30ms) eliminate LLM calls for common queries. Async pipeline (Celery) prevents slow LLM calls from blocking the API thread.

**Reliability:** Circuit breaker pattern wraps all OpenRouter calls. When error rate exceeds 20% within a 30s window, the breaker opens and subsequent requests immediately return a degraded response (cached result or KB fallback). This prevents a slow or unavailable LLM from cascading into full service outage. The breaker resets after 30s in half-open state.

**Cost control:** Three mechanisms. First, the tier routing pipeline itself — 70%+ requests never reach the LLM. Second, rate limiting at the Gateway (100 req/min per user) caps maximum LLM spend per user. Third, circuit breaker gating — when the LLM is unreliable, the system stops attempting calls rather than accumulating failed (but still billed) requests.

---

## 4. Related Work

### 4.1 Course Readings

CAP Theorem (Brewer) — Our system makes explicit CAP trade-offs per feature. Shopping list sync chooses AP (available and partition-tolerant) via CRDTs, while user account operations choose CP (consistent and partition-tolerant) via synchronous database writes. This per-feature approach aligns with the course's teaching that real systems don't make a single global CAP choice but rather decide per data path.

Prometheus & Grafana Documentation — Our observability stack follows the Prometheus pull-based metrics model. Each service exposes a /metrics endpoint with standardized naming conventions (e.g., `smartgrocery_gateway_request_duration_seconds`), and Grafana dashboards aggregate these into service-level and system-level views. The course's emphasis on observability as a "sociotechnical problem" (citing Cindy Sridharan) guided our decision to define metrics naming conventions early, before individual service implementation began.

### 4.2 External References

Reference 1: Prometheus & Grafana Documentation — see §4.1 above.

Reference 2: [https://microservices.io/patterns/microservices.html](https://microservices.io/patterns/microservices.html)

### 4.3 Related Piazza Projects

Project A: Real-Time Distributed Microservices Monitoring and Alerting System (Found by: William)

This project builds a monitoring and alerting platform using Apache Kafka, Prometheus, and Grafana on AWS ECS. Like Smart Grocery, it employs a microservice architecture with asynchronous messaging for service decoupling and uses Prometheus/Grafana for observability. Both projects evaluate horizontal scalability and fault tolerance through controlled experiments.

The key difference is scope: their system is a monitoring platform — Kafka serves as both infrastructure and the core data pipeline — whereas Smart Grocery is an end-user application where monitoring is supplementary. As a result, their experiments focus on message broker throughput and consumer group scaling, while ours target application-level behavior such as AI service reliability (circuit breaker under Claude API failures) and data consistency (CRDT-based list sync). Their project also does not include an AI component.

One question their design raises is how Experiments 3 and 4 interact: Experiment 3 scales consumer instances, which triggers Kafka consumer group rebalancing, while Experiment 4 measures end-to-end alert latency. Since rebalancing introduces its own delay, running these in sequence without isolation could conflate the two effects.

Project B: Terraform MCP for Any MCP-Compliant AI Provider (Found by: Dako)

Team 42 is building a Terraform MCP server that gives any MCP-compliant AI agent (Claude Code, Cursor, Copilot) structured, queryable access to live infrastructure state — deployed resources, service dependencies, and multi-cloud provider data.

Similarity: Both projects add a structured knowledge/context layer between the user request and the AI model. Smart Grocery does this with a curated KB (SQLite + Redis) so the LLM receives domain-grounded grocery context rather than reasoning from general training data. Team 42 does the same for infrastructure: their MCP layer surfaces live Terraform state so the agent doesn't hallucinate resource names or misconfigure dependencies. Both are motivated by the same principle — pre-retrieval grounding reduces token waste and improves accuracy.

Difference: Team 42 builds a developer-facing infrastructure tool; Smart Grocery is an end-user consumer application. Their "context" is live, mutable cloud state that changes with every deployment; our KB is a curated, read-only dataset updated offline. Their experiments measure portability across LLM providers and token efficiency reduction; ours measure cache hit rates, per-tier latency, and circuit breaker behavior under LLM failure. They also have no caching layer — each agent call queries live infrastructure — whereas caching is a core design pillar for us.

Project C: Measuring the Real Cost and Recovery of Splitting a Monolith (Found by: Sylvia)

Similarity: Our project shares several architectural building blocks with this monolith-decomposition study — both use Go microservices communicating over HTTP, Redis for caching, Locust for load testing, and structured logging with correlation IDs for observability.

Difference: Where our projects diverge is in intent and scope. Project C is a controlled experiment designed to empirically measure the cost of splitting a monolith into microservices across a single service boundary. Our project, by contrast, assumes a microservices architecture from the start and focuses on building a feature-rich grocery assistant with four services. Project C would provide the empirical evidence for a tradeoff between a monolithic architecture and microservice architecture.

---

## 5. Methodology

### 5.1 System Architecture

Smart Grocery is a polyglot microservices application with five components behind a single API Gateway:

```
Web (:3000) → API Gateway (:3001) → User Service (:4001) → user_db (PostgreSQL)
                                   → List Service (:4002) → list_db (PostgreSQL) + RabbitMQ
                                   → AI Service (:4003)   → Redis (cache) + SQLite (KB)
                                        ↓
                                   AI Worker (Celery) → OpenRouter LLM → Redis (results)
```

The Gateway enforces JWT auth, CORS, and rate limiting (100 req/min) for all requests. JWT tokens are verified again inside each downstream service (defense in depth). Services communicate only through the Gateway — no direct service-to-service calls.

The AI Service implements a three-tier routing pipeline:
```
Request → Cache (Redis) → KB (SQLite FTS5) → LLM (OpenRouter)
          ~2ms, free       ~30ms, free         ~2000ms, costs tokens
```

Sync endpoints (translate, item-info, alternatives) traverse all three tiers and respond directly. Async endpoints (suggest, per-list inspire) enqueue a Celery job, return a job ID, and the client polls `GET /api/v1/ai/jobs/:id` every 2 seconds.

### 5.2 Experiment Design — API Gateway (William)

Experiment 1: Gateway Throughput and Per-Service Latency Under Load

This experiment measures how the API Gateway performs as an entry point under increasing concurrency, identifying which downstream service becomes the bottleneck and at what load level.

- Independent variable: Number of concurrent users (1, 5, 20, 50)
- Dependent variables: End-to-end RPS, per-route median/p95/p99 latency, failure rate by service
- Controlled variables: All services running on Docker Compose (local), same hardware (MacBook Pro), 60-second test duration, identical user flow per virtual user (register → profile read/write → list read/write → AI item-info → health checks)
- Setup: Deploy all services via docker-compose up. Run Locust with FastHttpUser targeting the Gateway at localhost:3001. Each test runs for 60 seconds at a fixed concurrency level. Collect Locust statistics and Grafana dashboard snapshots after each run.
- Tradeoffs evaluated: Gateway overhead vs routing flexibility — does the additional network hop and JWT validation add meaningful latency compared to direct service access?

### 5.3 Experiment Design — User & List Service (Sylvia)

Experiment: Concurrent Write Consistency Under Simultaneous List Edits

This experiment tests whether the List Service correctly serializes concurrent writes to the same list and whether cross-database ownership checks (list_db sections referencing user_db users) hold under load.

- Independent variable: Number of concurrent writers (1, 5, 10) editing the same list simultaneously
- Dependent variables: Data integrity (no lost updates, no phantom items), ownership check failure rate, DB query latency under contention
- Controlled variables: Same list target, same hardware, 60-second duration, PostgreSQL on Docker Compose
- Setup: Locust spawns N concurrent users, each repeatedly adding/removing items from the same list section. After each run, query list_db directly and verify item count matches expected state. Compare with single-writer baseline.
- Tradeoffs evaluated: Separate databases (current) vs single database — separate DBs prevent cross-service coupling but require application-level consistency enforcement; single DB enables FK constraints but couples services at the data layer.

### 5.4 Experiment Design — AI Service (Dako)

Experiment: Tier Routing Effectiveness — Cache Hit Rate vs LLM Dependency

This experiment measures how effectively the three-tier pipeline reduces LLM calls and associated latency/cost, compared to a naive LLM-first baseline.

- Independent variable: Request repetition pattern — cold cache (first call per item) vs warm cache (repeated calls to the same 20-item pool). Cache TTL is 3600s.
- Dependent variables: Percentage of requests served by each tier (cache / KB / LLM), per-tier p50/p95 latency, estimated API cost per 1000 requests (LLM calls × ~$0.003/call)
- Controlled variables: Fixed pool of 20 grocery items for item-info requests, 50 concurrent users, 60-second test duration, all services on Docker Compose, same hardware
- Setup: Two runs. Run 1 (cold): flush Redis before start, run Locust targeting `POST /api/v1/ai/item-info` with random selection from the 20-item pool. Run 2 (warm): immediately repeat the same test without flushing cache. Read Prometheus counters `smartgrocery_ai_tier_hits_total{tier="cache"}` and `{tier="llm"}` after each run to compute hit distribution. Compare latency histograms from both runs.
- Tradeoffs evaluated: Cache TTL (currently 3600s) trades data freshness for cost. Longer TTL = more cache hits = lower LLM cost, but stale item info if product data changes. The experiment will quantify how much latency and cost the cache layer saves, informing the optimal TTL setting.

### 5.5 Observability Infrastructure

All five components (Gateway, User Service, List Service, AI Service, AI Worker) expose Prometheus `/metrics` endpoints. The Grafana provisioning directory (`infra/grafana/provisioning/`) contains dashboard JSON files that are auto-loaded on container start.

Shared naming convention: `smartgrocery_{service}_{metric}_{unit}` (e.g., `smartgrocery_ai_llm_duration_seconds`, `smartgrocery_gateway_requests_total`).

Key dashboard panels:
- System overview: RPS per service, error rate, p95 latency
- AI tier routing: cache hit rate, KB hit rate, LLM call rate (stacked bar, 1-minute windows)
- Circuit breaker state: binary gauge (0=closed/healthy, 1=open/degraded)
- Gateway: per-upstream latency heatmap, rate-limit trigger rate
- Database: query duration histograms for both PostgreSQL instances

Alerting rules (Prometheus alertmanager):
- `AILLMErrorRateHigh`: LLM error rate > 20% for 2 minutes → page on-call
- `GatewayLatencyHigh`: Gateway p99 > 500ms for 5 minutes → warning
- `DBQuerySlow`: DB p95 > 100ms for 5 minutes → warning

---

## 6. Preliminary Results

### 6.1 Results — API Gateway (William)

Experiment 1 (Gateway throughput under load) has been completed. Four test runs were executed at 1, 5, 20, and 50 concurrent users.

Throughput Scaling

| Users | RPS  | Avg Latency (ms) | p95 (ms) | p99 (ms) | Failure % |
| ----- | ---- | ---------------- | -------- | -------- | --------- |
| 1     | 1.3  | 17.18            | 61       | 420      | 6%        |
| 5     | 5.9  | 9.36             | 21       | 100      | 27%       |
| 20    | 18.1 | 6.16             | 12       | 57       | 29%       |
| 50    | 28.1 | 4.82             | 10       | 33       | 18%       |

Throughput scales nearly linearly from 1 to 50 users. The apparent decrease in average latency under higher load is a compositional artifact: at low concurrency, the slow AI requests (61-420ms) heavily weight the average, while at high concurrency, fast health-check and list endpoints (3-6ms) dominate the request mix and dilute the mean.

Per-Service Latency (p95)

| Service                  | 1 User | 50 Users | Trend                                 |
| ------------------------ | ------ | -------- | ------------------------------------- |
| Gateway only (/health)   | 8ms    | 7ms      | Stable — Gateway adds <8ms overhead   |
| User Service (GET /me)   | 16ms   | 10ms     | Stable                                |
| User Service (register)  | 97ms   | 110ms    | Slight increase — bcrypt is CPU-bound |
| List Service (GET /full) | 15ms   | 11ms     | Stable                                |
| AI Service (item-info)   | 420ms  | 42ms     | 100% failure — API key not configured |

Key findings so far:

The Gateway itself is not a bottleneck. The /health route (pure Gateway, no downstream call) remains at 3-5ms median regardless of concurrency. JWT validation and rate limiting add negligible overhead at this scale.

The AI Service is the slowest path by an order of magnitude (61-420ms baseline vs 5-13ms for other services) and is the only source of functional failures. This confirms that it is the correct target for circuit breaker protection.

The elevated failure rate (18-29%) is largely artificial: AI failures account for all functional errors, and auth-related failures stem from Locust's concurrent registration pattern creating JWT timing collisions. Production users with persistent sessions would not trigger these.

Remaining work for Experiment 1:
- Configure AI Service API key and re-run to capture real LLM latency
- Extend to 100+ users to find the actual breaking point
- Separate user registration from the test flow to eliminate auth-related false failures

### 6.2 Results — User Service (Sylvia)

[User Service Load Test Report](https://github.com/iDako7/SmartGroceryAssistant/blob/main/services/user-service/locust/load_test.md)

### 6.3 Results — List Service (Sylvia)

Consistency

In this project, users is in user_db and sections/items are in list_db — two separate PostgreSQL databases. The alternative would be putting everything in one database.
Separate databases (current approach):

- Each microservice owns its data independently — user-service can't accidentally query list tables and vice versa
- Services can be scaled, deployed, or migrated independently
- No cross-database foreign keys, so referential integrity is enforced in application code
- Can't do a single SQL JOIN across users and sections

Single database:

- Foreign keys work naturally (sections.user_id REFERENCES users(id))
- Can JOIN across all tables in one query
- Simpler ops — one connection string, one backup, one migration pipeline
- But services become coupled at the data layer, which undermines the point of microservices

The tradeoff is data isolation and independent scalability vs referential integrity and query simplicity. This project chose separation to align with the microservice architecture — each service fully owns its database.

Currently, no delete feature.
Eventual consistency gaps — If user-service deletes a user but list-service is down, there's no mechanism to propagate that change. We'd need to build a cleanup job or event-driven sync.

### 6.4 Results — AI Service (Dako)

Tier routing is partially validated. The cache layer (Redis, TTL=3600s) is operational; the KB layer is not yet implemented; LLM calls fail in CI because no API key is configured — consistent with §6.1 findings where AI Service shows 100% failure rate.

Measured so far (local Docker Compose, no LLM API key):

| Tier  | p50 Latency | p95 Latency | Current Hit Rate            | Status                        |
| ----- | ----------- | ----------- | --------------------------- | ----------------------------- |
| Cache | 2ms         | 4ms         | 0% (cold) / ~80% (projected warm) | Operational                   |
| KB    | —           | —           | N/A                         | Not yet implemented            |
| LLM   | —           | —           | 100% fallback (no cache/KB) | Failing — API key not set     |

The 2ms cache hit latency is measured from Redis GET on local Docker. This is consistent with Redis's expected sub-5ms p95 on localhost.

The warm cache projection (~80% hit rate for a 20-item pool with 50 concurrent users over 60 seconds) is based on the birthday problem: with 20 distinct items and random selection, after ~20 requests the cache has seen all items, and subsequent requests hit with probability proportional to pool reuse.

Remaining work:
- Configure OpenRouter API key and measure real LLM latency (projected: 1500–3000ms p50 based on Claude API benchmarks)
- Implement SQLite KB and measure KB tier latency with FTS5 queries on 50 Costco products
- Run the full cold vs warm cache comparison experiment and compute actual cost savings (LLM calls saved × $0.003/call)
- Add `smartgrocery_ai_tier_hits_total` Prometheus counter to make tier distribution observable without manual log parsing

Pathological worst case: every request is a cache miss (cache TTL expired or cold start) and the KB has no match — all 50 concurrent users fall through to the LLM simultaneously. At 2000ms per LLM call and 50 concurrent requests, the Celery worker queue depth grows faster than it drains, causing response times to degrade unboundedly. The circuit breaker is the primary mitigation: once 20% of LLM calls fail, it opens and subsequent requests return immediately (degraded but not blocking).

---

## 7. Impact

### 7.1 Significance

Smart Grocery is not a toy benchmark — it is a production-shaped application with real users, real AI costs, and real offline scenarios. This means the distributed systems trade-offs we measure are grounded in actual product constraints rather than synthetic workloads.

Three results should be broadly useful. First, our circuit breaker experiment quantifies the cost of protecting against a slow external API (Claude) in concrete terms: how much throughput do you preserve, how much response completeness do you sacrifice, and how fast does the system recover? Any team integrating LLM APIs into a microservice architecture faces this exact trade-off, and there is limited published data on circuit breaker behavior with LLM-scale latencies (2-5 seconds per call, vs the sub-100ms services typically studied).

Second, our CRDT sync experiment addresses a practical gap: most course materials discuss eventual consistency in theory, but few demonstrate it in an end-user application where two people edit the same shopping list offline and expect seamless merging. Our results will show whether LWW-Register and OR-Set resolve real editing conflicts without data loss, and what the sync latency looks like after reconnection.

Third, our cost analysis of the AI tier (local cache → Claude API, with circuit breaker gating) provides a reusable framework for any project that needs to balance AI capability against per-request cost and reliability.

### 7.2 Reproducibility and Class Participation

The entire system runs with a single docker-compose up. No AWS account or API key is required to test the core shopping list functionality (User Service, List Service, API Gateway). The AI features require a Claude API key, but the circuit breaker and fallback path can be tested without one — the system degrades gracefully by design.

We welcome classmates to test Smart Grocery in two ways. As end users: install the Expo Go app, scan the QR code we will provide, and try creating a shared shopping list with a partner — especially with one device in airplane mode to exercise the offline sync. As load testers: clone the repo, run docker-compose up, and point Locust at the Gateway. Our Locust scripts are included in the repository. If classmates run tests on different hardware configurations, the comparison would strengthen our throughput analysis.

The GitHub repository, setup instructions, and Locust scripts will be linked in our final Piazza post.

---

## Appendix

- [Architecture diagram]
- [Links to GitHub repo, CI/CD dashboard, Grafana dashboard]
- [Any supplementary data tables or charts]

\*\*
