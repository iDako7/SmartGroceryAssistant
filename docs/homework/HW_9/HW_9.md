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

Sylvia (Kaiyue Wei) — User Service + List Service (Go/Gin). Responsible for user registration, JWT issuance, dietary profiles, and all shopping list CRUD operations (sections, items, soft deletes, ownership enforcement). Infrastructure Setup and Observability for User and List Service.

William (Xing) — API Gateway (Node.js/Fastify) + Frontend (Next.js/React). Responsible for JWT auth enforcement, rate limiting, HTTP proxying, Prometheus metrics integration, and the full web UI including the two-step AI suggest flow and per-item AI panels.

### 1.3 Overview of Experiments

Three experiments, one per service owner:

**Experiment 1 (William — Gateway):** Gateway throughput and per-service latency under increasing concurrency (1, 5, 20, 50 users). Evaluates whether the Gateway itself becomes a bottleneck and which downstream service limits system throughput.

**Experiment 2a (Sylvia — List Service):** Concurrent write serialization under simultaneous list edits. Evaluates whether the List Service correctly serializes concurrent writes to the same list without lost updates, duplicate items, or phantom entries.

**Experiment 2b (Sylvia — User/List Service):** Cross-database ownership enforcement under load. Evaluates whether ownership checks that span two databases (list_db sections referencing user_db users) remain correct under concurrent access, and quantifies the trade-offs between the shared-database and database-per-service patterns.

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

**Parnas, "On the Criteria To Be Used in Decomposing Systems into Modules" (1972)** — Parnas's principle of information hiding is the foundational justification for our microservice boundaries. Each service (User, List, AI) encapsulates its own data store and internal logic behind a well-defined API. The User Service hides bcrypt hashing and JWT issuance details; the List Service hides soft-delete mechanics and section-based ownership; the AI Service hides the three-tier routing pipeline. No service needs to know another's implementation — only its HTTP contract. This is Parnas's module decomposition applied at the network boundary rather than the function boundary.

**CAP Theorem (Brewer)** — Our system makes explicit CAP trade-offs per data path. User account operations (registration, login, profile updates) choose CP — synchronous PostgreSQL writes with immediate consistency, at the cost of unavailability if the database is down. Shopping list operations currently also choose CP via synchronous writes to `list_db`, but the long-term roadmap (§3.2) targets AP for list sync via CRDTs (OR-Set for items, LWW-Register for metadata), accepting temporary inconsistency across devices in exchange for offline availability. The per-feature CAP approach aligns with the course's teaching that real systems don't make a single global CAP choice but rather decide per data path.

### 4.2 External References

**[Microservices Patterns — Chris Richardson](https://microservices.io/patterns/microservices.html)** — Reference for the API Gateway, Database-per-Service, and Circuit Breaker patterns used in our architecture. Our Gateway implements the API Gateway pattern (single entry point, JWT enforcement, rate limiting, request routing), and our separate `user_db`/`list_db` databases follow the Database-per-Service pattern.

**Circuit Breaker Pattern (Nygard, *Release It!*)** — The AI Service wraps all OpenRouter LLM calls in a circuit breaker. When error rate exceeds 20% within a 30-second window, the breaker opens and subsequent requests immediately return a degraded response (cached result or KB fallback) instead of waiting for a slow or failing external API. This prevents a single slow dependency (the LLM at 2-5s per call) from cascading into full service outage.

**Database-per-Service Pattern** — Our architecture uses separate PostgreSQL databases (`user_db` and `list_db`) rather than a shared database. This enforces service independence at the data layer — User Service cannot accidentally query list tables and vice versa — but sacrifices cross-database foreign keys and JOIN capability. Ownership enforcement (`sections.user_id`) must be validated in application code rather than by database constraints. This trade-off is central to Experiment 2 (§5.3).

**AI Inference Optimization — Tiered Caching for LLM Cost Control** — The AI Service implements a tiered inference pipeline (Cache → KB → LLM) to minimize latency and cost. This approach draws from the broader pattern of hierarchical caching in distributed systems: serve from the fastest, cheapest layer possible and only escalate to expensive computation (cloud LLM calls at ~$0.003/request and 2-3s latency) when local layers miss. The Redis cache layer (~2ms) and SQLite KB layer (~30ms) together aim to handle 70%+ of requests without any LLM call. This is analogous to CPU cache hierarchies (L1 → L2 → L3 → main memory) applied to AI inference — each tier trades capacity for speed.

**[Prometheus Documentation](https://prometheus.io/docs/)** — Reference for our pull-based metrics collection, histogram instrumentation, and PromQL alerting rules. Each service exposes standardized metrics following Prometheus naming conventions (`smartgrocery_{service}_{metric}_{unit}`). The course's emphasis on observability as a "sociotechnical problem" (citing Cindy Sridharan) guided our decision to define metrics naming conventions early, before individual service implementation began.

**[Grafana Documentation](https://grafana.com/docs/grafana/latest/)** — Reference for our dashboard auto-provisioning and visualization. Grafana dashboards are defined as JSON files in `infra/grafana/provisioning/` and auto-loaded on container start, providing service-level and system-level views of request rates, latency distributions, and error rates across all services.

**[OpenRouter API Documentation](https://openrouter.ai/docs)** — The AI Service uses OpenRouter as an LLM gateway rather than calling Anthropic's API directly. This allows model routing (selecting Claude or other models per request type) through a single integration point, using the OpenAI Python SDK with a base URL override.

**[Celery Documentation](https://docs.celeryq.dev/)** — Reference for the async job pipeline in the AI Service. Long-running LLM calls (suggest, inspire) are offloaded to Celery workers to prevent blocking the FastAPI event loop. Results are stored in Redis and polled by the client.

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

Two experiments target different aspects of the data layer: write correctness under contention and cross-database ownership enforcement.

#### Experiment 2a: Concurrent Write Serialization

**Question:** Does the List Service correctly serialize concurrent writes to the same list without lost updates, duplicate items, or phantom entries?

When multiple users (or the same user on multiple devices) add, update, or remove items in the same list section simultaneously, PostgreSQL must serialize those writes. This experiment measures whether the application and database layer together preserve data integrity under contention.

- **Independent variable:** Number of concurrent writers (1, 5, 10) targeting the same list section
- **Dependent variables:**
  - Data integrity — after each run, query `list_db` directly and compare actual item count and item state against the expected count derived from the operations log. Any mismatch indicates a lost update, duplicate insert, or phantom item.
  - Write latency — per-operation p50/p95/p99 latency for `POST /items` (add) and `PATCH /items/:id` (update) under contention vs. single-writer baseline
  - Error rate — HTTP 409 (conflict) or 500 (internal error) responses that indicate serialization failures at the application level
- **Controlled variables:** Same list section target, same hardware (MacBook Pro), 60-second test duration, PostgreSQL on Docker Compose, all writers authenticated as the list owner
- **Setup:**
  1. Pre-create a user, a list section, and seed it with 10 items.
  2. Locust spawns N concurrent writers. Each writer runs a loop: pick a random existing item → update its name (PATCH), then add a new item (POST), then soft-delete a random item (DELETE). Each operation is logged with a client-side sequence number.
  3. After the 60-second run, a verification script queries `list_db` and reconciles the final state against the operations log. Specifically: (a) total active items = seed count + adds − deletes, (b) no item has two concurrent name values, (c) no soft-deleted item reappears.
  4. Repeat at 1, 5, and 10 concurrent writers and compare latency and integrity results.
- **Expected outcome:** PostgreSQL row-level locking should serialize writes correctly at all tested concurrency levels. Latency is expected to increase at 10 writers due to lock contention, but no data integrity violations should occur. If violations are found, it indicates a bug in the application-level transaction handling (e.g., a missing `SELECT ... FOR UPDATE` or a TOCTOU race).

#### Experiment 2b: Cross-Database Ownership Enforcement Under Load

**Question:** Do ownership checks that span two databases (list_db and user_db) remain correct under concurrent access, and what are the trade-offs between the shared-database and database-per-service patterns?

In the current architecture, `list_db` stores sections and items, while `user_db` stores user accounts. When a user creates or accesses a list section, the List Service must verify that the requesting user exists and owns that section. Because there are no cross-database foreign keys, this ownership check is enforced in application code — the List Service JOINs `sections.user_id` against the JWT-extracted user ID. This experiment tests whether that application-level enforcement holds under load and evaluates the trade-off against a single-database design.

- **Independent variable:** Number of concurrent users (1, 5, 10), each attempting to access or modify list sections — a mix of legitimate owners and unauthorized users
- **Dependent variables:**
  - Ownership enforcement correctness — no unauthorized user should successfully create, read, update, or delete another user's list items. After each run, verify that every item in `list_db` traces back to the correct `user_id` via the section.
  - Ownership check latency — time for the List Service to validate `user_id` from the JWT against `sections.user_id` in `list_db` under contention
  - False rejection rate — legitimate requests that fail due to timing issues (e.g., JWT issued before user record fully propagated)
- **Controlled variables:** Same hardware, 60-second duration, both PostgreSQL instances on Docker Compose, fixed ratio of legitimate (80%) to unauthorized (20%) requests
- **Setup:**
  1. Pre-create 5 users in `user_db`, each owning 2 list sections in `list_db`.
  2. Locust spawns N virtual users. 80% of requests use the correct owner's JWT to perform list operations. 20% of requests deliberately use a different user's JWT to attempt access to sections they don't own.
  3. After each run, verify: (a) all 20% unauthorized requests received HTTP 403/404, (b) no item in `list_db` was created or modified by a non-owner, (c) legitimate owner operations all succeeded.
  4. Repeat at 1, 5, and 10 concurrent users.
- **Trade-offs evaluated — shared database vs. database-per-service:**

  | Dimension | Shared Database | Database-per-Service (current) |
  |-----------|----------------|-------------------------------|
  | Referential integrity | Native FK constraints — `sections.user_id REFERENCES users(id)` enforced by PostgreSQL, zero application code needed | No cross-database FKs — ownership enforced in application code (JWT + section JOIN), must be tested explicitly |
  | Query flexibility | Single JOIN across users and sections — simple ownership queries | Cannot JOIN across databases — requires two queries or trusts the JWT as source of truth |
  | Service coupling | Services share a schema — changes to `users` table can break List Service queries | Full data isolation — each service owns its schema, can evolve independently |
  | Independent scaling | Both services scale the same database — connection pool contention under load | Each database scales independently — User Service load doesn't affect List Service DB |
  | Operational simplicity | One connection string, one backup, one migration pipeline | Two databases to manage, monitor, and back up separately |
  | Failure isolation | If the shared DB goes down, both services fail simultaneously | If `user_db` goes down, List Service can still serve cached/existing data (degraded mode) |
  | Eventual consistency | Not applicable — single source of truth | Gap exists: if a user is deleted in `user_db` while List Service is down, orphaned list data persists until a cleanup job or event-driven saga runs |

- **Expected outcome:** Ownership checks should hold at all concurrency levels — the JWT-based enforcement doesn't depend on cross-database queries at request time, so it should be resilient. The primary risk is a race condition where a user is deleted in `user_db` mid-experiment and List Service continues to accept their JWT (since JWTs are stateless). This would demonstrate the eventual consistency gap inherent in the database-per-service pattern.

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

### 6.2 Results — Experiment 2a: Concurrent Write Serialization (Sylvia)

#### User Service Load Test (Completed)

Before testing concurrent list writes, we load-tested the User Service to establish a baseline for the Go/Gin + PostgreSQL stack. Tests ran on Docker (1 master + 5 workers), 1-minute duration each.

**Workload model:** 90% returning users (login, profile read/update) and 10% new signups. Request mix: ~60% `GET /users/me`, ~15% login, ~15% profile update, ~5% register, ~5% health check.

**100 Users (Baseline) — 29.9 RPS**

| Endpoint | # Requests | Median | Avg | RPS |
|---|---|---|---|---|
| `GET /api/v1/users/me` | 1,039 | 2ms | 3.2ms | 18.1 |
| `POST /api/v1/users/login` | 314 | 69ms | 73.4ms | 3.3 |
| `PUT /api/v1/users/me` | 239 | 2ms | 4.5ms | 4.9 |
| `POST /api/v1/users/register` | 106 | 65ms | 75.8ms | 2.0 |
| `GET /health` | 74 | 1ms | 1.7ms | 1.6 |
| **Aggregated** | **1,862** | **3ms** | **25.6ms** | **29.9** |

0 failures. Service handles this comfortably.

![Grafana — 100 users baseline](https://github.com/iDako7/SmartGroceryAssistant/blob/main/services/user-service/locust/results/baseline_100_grafana.png?raw=true)

**500 Users (Moderate) — 146.1 RPS**

| Endpoint | # Requests | Median | Avg | RPS |
|---|---|---|---|---|
| `GET /api/v1/users/me` | 4,873 | 1ms | 80ms | 88.1 |
| `POST /api/v1/users/login` | 1,521 | 65ms | 343ms | 20.1 |
| `PUT /api/v1/users/me` | 1,105 | 1ms | 50.5ms | 20.9 |
| `POST /api/v1/users/register` | 505 | 60ms | 219ms | 9.3 |
| `GET /health` | 403 | 1ms | 5.4ms | 7.7 |
| **Aggregated** | **8,857** | **2ms** | **190ms** | **146.1** |

0 failures. Latencies climbing — login avg 5x slower, registration avg at 219ms.

![Grafana — 500 users moderate](https://github.com/iDako7/SmartGroceryAssistant/blob/main/services/user-service/locust/results/500_grafana.png?raw=true)

**1000 Users (Stress) — 288.8 RPS**

| Endpoint | # Requests | Median | Avg | RPS |
|---|---|---|---|---|
| `GET /api/v1/users/me` | 7,171 | 2ms | 549ms | 176.8 |
| `POST /api/v1/users/login` | 2,466 | 160ms | 1,600ms | 39.2 |
| `PUT /api/v1/users/me` | 1,604 | 2ms | 300ms | 41.5 |
| `POST /api/v1/users/register` | 743 | 72ms | 948ms | 17.6 |
| `GET /health` | 544 | 1ms | 11.2ms | 13.7 |
| **Aggregated** | **13,428** | **7ms** | **930ms** | **288.8** |

0 failures, but severe latency degradation across all endpoints.

![Grafana — 1000 users stress](https://github.com/iDako7/SmartGroceryAssistant/blob/main/services/user-service/locust/results/1000_grafana.png?raw=true)

**Key observations from User Service load tests:**

1. **Bcrypt is the bottleneck** — login and register use password hashing; avg latency explodes from ~70ms (100u) to 1.6s (1000u)
2. **Reads stay fast at median** — `GET /users/me` median holds at 1-2ms even at 1000 users, but avg spikes to 549ms due to queuing behind bcrypt-heavy requests
3. **No failures at any tier** — the service degrades gracefully (slower, not broken)
4. **Throughput scales linearly** — 30 → 146 → 289 RPS across tiers

#### List Service Concurrent Write Test (Planned)

The concurrent write serialization experiment for List Service is planned but not yet executed.

What has been verified so far:
- List Service CRUD endpoints (sections and items) are functional with soft deletes and user ownership enforcement via section JOIN
- Single-user write path works correctly — items are created, updated, and soft-deleted as expected
- PostgreSQL row-level locking is the default isolation mechanism; no explicit `SELECT ... FOR UPDATE` has been added yet

Remaining work:
- Build Locust test script that spawns N concurrent writers targeting the same list section with interleaved add/update/delete operations
- Build a post-run verification script that queries `list_db` and reconciles final state against the operations log
- Run at 1, 5, and 10 concurrent writers and collect latency + integrity results
- If data integrity violations are found, add explicit row-level locking or transaction isolation level changes

### 6.3 Results — Experiment 2b: Cross-Database Ownership Enforcement (Sylvia)

Preliminary: The cross-database ownership experiment has not yet been executed. However, the architectural analysis of the shared-database vs. database-per-service trade-off is complete.

**Current architecture:** Users are stored in `user_db` and sections/items in `list_db` — two separate PostgreSQL databases.

Why we chose database-per-service:
- Each microservice owns its data independently — User Service can't accidentally query list tables and vice versa
- Services can be scaled, deployed, or migrated independently
- Aligns with the microservice principle of loose coupling at the data layer

What we give up:
- No cross-database foreign keys — `sections.user_id` cannot reference `users(id)`, so referential integrity must be enforced in application code
- Cannot do a single SQL JOIN across users and sections — ownership verification relies on the JWT as the source of truth
- Operational overhead — two databases to manage, monitor, and back up

**Known eventual consistency gap:** If User Service deletes a user while List Service is down, orphaned list data persists in `list_db`. No cleanup mechanism exists yet. The planned mitigation is either a periodic cleanup job or an event-driven saga via RabbitMQ dead-letter queue.

Remaining work:
- Build Locust test script with a mix of legitimate owner requests (80%) and unauthorized cross-user requests (20%)
- Run at 1, 5, and 10 concurrent users and verify that all unauthorized requests are rejected (HTTP 403/404)
- Test the eventual consistency gap: delete a user in `user_db` mid-test and verify whether List Service continues to accept their (still-valid) JWT
- Add Prometheus metrics (`smartgrocery_db_query_duration_seconds`, `smartgrocery_http_requests_total`) to both Go services for observability during experiments

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

\*\*
