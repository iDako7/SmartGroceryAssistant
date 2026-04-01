# AI Service -- High Level Architecture Design Decisions

**Last updated:** 2026-03-31
**Purpose:** Concise reference for interviews and tech presentations. Each decision includes reasoning and why alternatives were rejected.

---

## Tier Routing: Hybrid Approach

**Decision:** Explicit request-type routing as backbone, confidence-based scoring only inside the KB tier for fuzzy search.

**Why:** Different request types have deterministic tier eligibility. `translate` never needs LLM if KB has the data. `suggest` always needs LLM. Only KB fuzzy search (FTS5) benefits from confidence scoring -- the rest is binary hit/miss.

**Why not alternatives:**

- Pure confidence-based routing (all tiers score every request): Wastes computation on tiers that can never serve a given request type. `suggest` always scores 0 in KB -- why run it?
- Pure explicit routing (no confidence scoring): Can't distinguish "KB found a great match" from "KB found a weak match" on fuzzy queries like "find meat products."

**Trade-off:** Slightly more routing config to maintain, but deterministic behavior for most requests and smart fallback where it matters.

---

## KB Storage: SQLite + FTS5

**Decision:** SQLite file deployed alongside the AI service container, with FTS5 virtual tables for full-text search.

**Why:** The KB is read-only reference data (populated offline, queried in production). SQLite gives zero operational overhead -- no server, no connection pooling, no network hop. ~0.01ms read latency vs ~1-5ms for a networked DB. FTS5 is built-in, no extensions needed.

**Why not alternatives:**

- PostgreSQL: Adds another database to manage, back up, migrate. Network latency on every KB lookup undermines the "fast and free" tier. Overkill for read-only reference data.
- Elasticsearch: Industrial-strength full-text search for 50-500 products is like using a forklift to move a chair. Adds a JVM-based service to operate.
- MongoDB: No advantage over SQLite for structured, read-only reference data. Adds a server to manage.

**Trade-off:** SQLite has a single-writer limitation and can't do vector similarity search. Neither matters for MVP (read-only, no RAG). When RAG is added in the future, vector search goes to pgvector/ChromaDB alongside SQLite, not replacing it.

---

## LLM Output: Structured JSON Mode

**Decision:** All LLM responses use structured JSON output format, not free text.

**Why:** Uniform interface across all three tiers -- cache returns JSON, KB returns JSON, LLM returns JSON. The consuming code doesn't care which tier served the response. Parsing is deterministic, not regex-based.

**Why not alternatives:**

- Free text + parsing: Fragile. LLM changes phrasing ("Here are 3 suggestions:" vs "I suggest:"), regex breaks. Every prompt format change requires parser updates.
- Function calling: Not all models support it via OpenRouter. Ties you to specific model capabilities, reducing flexibility in model selection.

**Trade-off:** Structured output slightly constrains LLM creativity. Acceptable because grocery suggestions need reliability more than literary flair.

---

## Cache: Redis with Per-Request-Type TTL

**Decision:** Redis for Tier 1 cache. Different TTL per request type. Cache key includes user preferences.

**Why:** Translations are stable (long TTL, hours/days). Suggestions are context-dependent (short TTL). A single TTL either wastes cache on stable data or serves stale suggestions.

**Why not alternatives:**

- In-memory cache (e.g., Python dict, lru_cache): Lost on process restart. Can't share across multiple service instances if you scale horizontally.
- Single TTL for all request types: Either too short (evicts stable translations unnecessarily) or too long (serves stale suggestions).
- No cache: Violates the 70% non-LLM target. Every repeated query hits KB or LLM.

**Trade-off:** More TTL configuration to tune. Mitigated by starting with conservative defaults and adjusting based on measured hit rates.

---

## Async Pipeline: Celery + Redis Broker (MVP) -> RabbitMQ Experiment (Phase 4)

**Decision:** Use Celery as the task queue abstraction. Start with Redis as broker, experiment with RabbitMQ in Phase 4, pick the winner with load test data.

**Why:** Celery abstracts the broker -- task code stays the same whether backed by Redis or RabbitMQ. Swapping is a one-line config change (`redis://` -> `amqp://`). Starting with Redis means zero additional infrastructure (already using Redis for cache). This gives the strongest resume story: "evaluated both brokers with real load tests and made a data-driven decision."

**Why not alternatives:**

- Raw RabbitMQ from day 1: AMQP protocol, exchanges, bindings, ack/nack semantics -- too much to learn alongside FastAPI and async Python when you're new to all three.
- Redis Streams directly: You build retry logic, dead letter handling, consumer groups, worker lifecycle, result storage all from scratch. Celery gives you all of this out of the box.
- AWS SQS: Vendor lock-in. Can't run locally without LocalStack. Harder to load test meaningfully.
- No queue (synchronous LLM calls): `suggest` and `inspire` take 5-15s. Blocking the API thread kills concurrent capacity. Not acceptable.

**Trade-off:** Celery adds a dependency and has its own quirks (serialization, timezone handling). But the broker-agnostic abstraction is worth it for the experiment strategy.

---

## KB Schema: Flavor & Component Tagging in MVP

**Decision:** Add `component_role` on products, `flavor_tags` junction table, and `flavor_profile` on recipes to the Phase 1 KB schema — populated during seed, not exercised by any MVP endpoint.

**Why:** These columns are the data foundation for a future `/restock` endpoint (OQ-7) that recommends balanced grocery runs based on current inventory and flavor preferences. Tagging during initial seed costs ~30 seconds per product. Retrofitting later requires a full re-seed or data migration.

**Key insight:** Flavor profiles (spicy-umami, sweet-savory) are more useful than cuisine labels for cross-cultural recommendations. Inspired by Cookwell's component-slot model (PCSV: Protein, Carb, Sauce, Vegetable).

**Trade-off:** Slight schema complexity with no immediate user-facing benefit. Justified by near-zero marginal cost during seed vs high cost of retroactive tagging.

---

## RAG: Deferred to Future Phase

**Decision:** MVP uses structured SQLite + FTS5. RAG (embeddings + vector search) is a future phase.

**Why:** 50 products is too small for semantic similarity search to outperform keyword matching. RAG infrastructure (embedding pipeline, vector storage, retrieval tuning, chunk strategy) is significant overhead. FTS5 handles "find meat products" well enough for MVP.

**Why not alternatives:**

- RAG from day 1: Adds embedding model costs, vector DB operations, chunk strategy decisions, and retrieval quality tuning -- all before you have enough data to justify it. Classic premature optimization.
- Never add RAG: As KB grows to hundreds of products and recipes, FTS5 keyword matching will fail on semantic queries like "what goes well with Korean BBQ for a winter dinner." Embeddings will be needed.

**Trade-off:** May need to refactor the KB tier interface when adding RAG later. Mitigated by designing the tier interface to be pluggable from the start.

---

## Deployment: AWS ECS Fargate

**Decision:** Deploy all services as ECS Fargate tasks on AWS.

**Why:** Serverless containers -- no EC2 instances to manage, patch, or SSH into. Each microservice maps to an ECS task definition. Auto-scaling built in. Natural progression from Docker Compose (local) to Fargate (prod).

**Why not alternatives:**

- EC2 + Docker Compose: Cheapest option (~$15-30/mo), but you manage the OS, Docker daemon, container restarts, and monitoring yourself. Weaker resume signal.
- EKS (Kubernetes): ~$75+/mo just for the cluster fee. Massive operational overhead (etcd, node pools, Helm charts, RBAC). Unjustified for 10 users. Interviewers recognize this as over-engineering.
- AWS Lambda: Cold start latency (500ms-2s) is unacceptable for sub-second KB responses. Not suited for long-running LLM calls (5-15s). Would require rearchitecting the async pipeline.

**Trade-off:** ~$15-20/mo more than bare EC2. The operational simplicity and resume value justify the premium for a portfolio project.

---

## Scale Philosophy: Design for Scale, Deploy for Load

**Decision:** Interfaces support horizontal scaling (queue abstraction, stateless services, external cache). Deployment targets actual load (10 users, single instance of everything).

**Why:** Over-engineering deployment for hypothetical scale wastes time and money. Interface design (clean abstractions, broker-agnostic queuing, external state) is cheap. Infrastructure scaling (more workers, bigger instances, multi-region) is expensive and should be justified by actual load.

**Why not alternatives:**

- Deploy at scale from day 1: Multi-worker, multi-region, auto-scaling for 10 users is burning money and time on problems you don't have.
- No scalability consideration: Hardcoded localhost, in-process state, synchronous everything -- works for 1 user, collapses at 10. Rearchitecting later is expensive.

**Trade-off:** Will need infrastructure work if load actually grows. That's a good problem to have, and the interface design makes scaling a deployment change, not an architecture change.

---

## Service Layer: LLMClient Class + Domain Functions (Phase 2)

**Decision:** Extract shared LLM infrastructure (OpenAI client, caching, JSON parsing) into an `LLMClient` class. Keep endpoint-specific logic (prompt construction, response shaping) as standalone async domain functions that receive the client as a parameter.

**Why:** Phase 1 implemented everything as module-level functions in a single `claude.py` file, mixing infrastructure (client creation, cache lookup, JSON parsing) with domain logic (prompt text, response schemas). As the service grows from 3 to 5+ endpoints, this becomes harder to test and modify. Separating infrastructure from domain logic means:
- Prompt changes don't touch infrastructure code
- `LLMClient` can be mocked cleanly in domain function tests
- When KB tier is added in Phase 4, `LLMClient` becomes one tier behind a router — domain functions don't change
- The owner can test prompts directly by calling `LLMClient.call()` with arbitrary prompt strings

**Why not alternatives:**

- One service class per endpoint (AlternativesService, InspireService, etc.): Over-engineered for 7 endpoints that share identical infrastructure. Each class would duplicate the same constructor (`__init__(self, llm_client)`) and the same call-parse-fallback pattern. Creates unnecessary boilerplate.
- Single AIService class with all methods: Simpler short-term, but becomes a god-class (15+ methods by Phase 5). Harder to test individual endpoints in isolation. Method count grows linearly with endpoints.
- Keep module-level functions (status quo): Works for Phase 1's 3 endpoints, but the shared infrastructure (client, cache, JSON parsing) becomes implicit global state. Harder to test, harder to swap implementations.

**Trade-off:** Two files instead of one (`llm_client.py` + `domains.py` vs `claude.py`). Slightly more indirection. Justified by testability and the clean Phase 4 upgrade path.

---

## Two-Tier Model Configuration (Phase 2)

**Decision:** Configure two model tiers via environment variables: `OPENROUTER_MODEL_FAST` for simple tasks (translate, item-info) and `OPENROUTER_MODEL_FULL` for complex tasks (alternatives, inspire, clarify).

**Why:** Different endpoints have vastly different complexity requirements. Translate and item-info are simple lookups — a smaller, cheaper model handles them well. Alternatives, inspire, and clarify require multi-step reasoning, recipe knowledge, and adaptive question generation — they benefit from a more capable model. Two tiers allow testing cheaper models on simple tasks without degrading complex task quality, finding the best cost/quality balance.

**Why not alternatives:**

- Single model for everything (Phase 1 status quo): Forces a choice between overpaying for simple tasks or under-serving complex ones. No room to optimize cost.
- Per-endpoint model override (e.g., `OPENROUTER_MODEL_TRANSLATE`, `OPENROUTER_MODEL_CLARIFY`): Maximum flexibility but 7+ env vars to manage. Most endpoints within the same complexity tier will use the same model anyway. Premature granularity.

**Trade-off:** Two env vars instead of one. If a third tier emerges (e.g., "reasoning" for suggest), it's a simple addition to the config and `LLMClient`.

---

## User Profile Delivery: Request Body (Temporary) (Phase 2)

**Decision:** Accept an optional `profile` object (dietary restrictions, household_size, taste preferences) in the request body of all AI endpoints. Services use it if present, work without it.

**Why:** User profile context improves AI response quality (e.g., suggesting vegan alternatives for a vegan user). The ideal approach is fetching the profile from User Service using the JWT's `user_id`, but User Service doesn't expose a profile endpoint with the needed fields yet. Embedding profile in the request body is a zero-dependency approach that unblocks prompt engineering work now.

**Why not alternatives:**

- AI Service fetches from User Service: Requires User Service to expose a new endpoint, adds inter-service HTTP call latency, needs caching and graceful degradation. Correct long-term solution, but blocked by cross-team dependency.
- Gateway attaches profile to forwarded request: Adds business logic to the Gateway (which should only handle auth, routing, rate limiting). Violates Gateway's single responsibility.
- Skip profile entirely for now: Delays prompt quality improvements. Profile context is the difference between generic and personalized suggestions.

**Trade-off:** Clients must send profile data with each request (redundant payload). When User Service adds the profile endpoint, refactor to server-side fetch and remove the field from request bodies. The optional nature of the field means no breaking change when switching.

---

**Timeline:** 2026-03-30 — Phase 1 Reflection

## Dependency Injection (DI) for Layer Boundaries (Phase 1)

**Decision:** Use dependency injection as the core boundary pattern between route handlers, service/domain logic, and the LLM client layer.

**Why:** DI keeps each layer focused on one responsibility and removes hidden global coupling. Dependencies can be replaced in tests, which makes behavior isolation and failure-path testing straightforward. This becomes more valuable as endpoint count grows and shared infrastructure evolves.

**Why not alternatives:**

- Implicit module-level globals: Faster to start, but harder to test and reason about as files grow.
- Tight direct imports across layers: Creates rigid coupling where route changes can ripple into service and client internals.

**Trade-off:** Slightly more constructor/wiring boilerplate. The added structure pays off in maintainability and testability as the system scales beyond the initial Phase 1 endpoints.
