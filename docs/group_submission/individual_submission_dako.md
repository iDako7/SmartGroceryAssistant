# CS6650 Final Project — Individual Lessons Learned
**Qi Wei (Dako, @iDako7)** — AI Service + AI Worker owner

---

## Where I Started

I joined this project as the AI service owner. The plan was to build a three-tier inference service in Python and FastAPI: cache first, then a local knowledge base, then fall through to an LLM. Not a single LLM proxy, something with actual routing logic.

My background coming in: comfortable thinking about systems, okay at Python, never touched FastAPI, never touched async Python at all beyond reading about it. I had used the OpenAI SDK a handful of times. That was it. I knew the architecture I wanted and was not sure I could actually write it.

The nervous part was the async stuff. Celery, Redis as a broker, polling job status. The architecture diagram in the phased plan looked clean. I was not confident I could make it run.

---

## How the Service Grew: Phases 1 Through 3

### Phase 1: Getting the skeleton up

Phase 1 was two endpoints: `POST /translate` and `POST /item-info`. The goal was just: can I make an HTTP request land at a FastAPI route, call an LLM, get structured JSON back, and return it. That is all.

The thing that tripped me up early was the SDK. The AI service does not call Anthropic directly. It uses the `openai` Python SDK but with the OpenRouter base URL overridden. So I had OpenAI's SDK, talking to OpenRouter, returning whatever model I configured. That combination had quirks. The structured JSON output flag behaved differently across providers, and some models ignored `response_format` entirely.

JWT auth was the other Phase 1 piece. The project uses defense in depth: tokens are verified at the API Gateway and also locally inside the AI service. I wrote the auth middleware from scratch, which meant reading JWTs in Python for the first time. It worked. More importantly, I wrote tests for it before wiring it into the routes, and that was the first real payoff from the TDD approach.

Phase 1 shipped with 70+ tests. I remember that number because it felt absurd at the time. Two endpoints, 70 tests.

### Phase 2: The domain refactor

Phase 2 added three more sync endpoints: `POST /alternatives`, `POST /inspire/item`, and `POST /clarify`. It also introduced a user profile field, optional on all endpoints, so a vegetarian user gets different alternatives than a default user.

By the end of Phase 1, the LLMClient class was doing too many things. Prompt construction was living next to HTTP retry logic, next to JSON parsing, next to the actual API call. It was getting long.

So I extracted `domains.py`. The rule: LLMClient handles infrastructure (HTTP, retries, JSON parsing, caching). Domain functions handle logic (what the prompt says, how to shape the response). The route function just calls a domain function and returns the result. Nothing else.

That separation was the most useful architectural move of the whole project. In Phase 3 and in the eval iteration, I changed prompts constantly. Because prompts lived in `domains.py` as pure functions, I could change them without touching anything else. If I had left prompt logic inside the LLMClient or inside the route, every change would have been a minor excavation.

Lesson, written plainly: separate your transport layer from your logic layer. This is not a new idea. I knew it. But I did not feel it until I had the wrong structure for a few weeks first.

### Phase 3: The async pipeline

`POST /suggest` is the heavy endpoint. User submits their full grocery list plus answers from the clarify step. The service queues a Celery task, returns a 202 with a job ID, and the client polls `GET /jobs/:id` every two seconds. The worker processes the task, writes the result to Redis with a one-hour TTL, and the next poll picks it up.

This was the part I was most worried about. It worked end-to-end on the first real run after the domain refactor, and that felt good. The structure was clean enough that wiring Celery in was not actually complicated. The TDD workflow helped here too: I wrote tests for the job submission route (returns job_id), tests for the polling route (pending then completed), and tests for the worker task logic before writing `tasks.py`. Having that scaffolding meant I could run the tests at each step and know where things broke.

---

## The Bug I Learned Most From

Gemini 2.5 Pro scored 0/8 on the first suggest endpoint evaluation. Zero out of eight. Every single test case failed.

The root cause: Gemini is a reasoning model. Before it outputs its actual response, it emits reasoning tokens. Those tokens look like `Thinking: let me consider the structure...` followed eventually by the JSON. My parser expected JSON. It got a paragraph of internal monologue first, then the JSON. Every parse call threw.

I spent time assuming this was a prompt issue. I reworded things. Nothing changed. Then I looked at the raw response string and saw the "Thinking:" prefix staring back at me.

The fix was suppression in both places: the system prompt and the user prompt. "Respond with JSON only. No markdown, no explanations." plus "RESPOND WITH ONLY A JSON OBJECT. No explanations, no thinking." Blunt, repeated twice. After that, zero "Thinking:" prefix failures.

The lesson is about contract enforcement at service edges, which is a concept from the course applied to a very concrete situation. When two services agree on a contract (in this case, "the response is a JSON object"), you cannot just state the contract once and trust both sides to honor it. You have to validate at the boundary. I was validating the schema of the JSON, but I was not defending the boundary before the JSON. The model was allowed to emit arbitrary text before the structured output, and it did.

This is the same principle as input validation at API boundaries, or schema enforcement between microservices. The contract must be enforced at both ends. Stating it in a comment or a docstring is not enforcement.

---

## A Caching Subtlety

When I added Redis caching to the sync endpoints, the initial cache key was just the endpoint name plus the input. Something like `alternatives:chicken breast`. That works until two users with different profiles hit the same key.

A vegetarian user asking for chicken breast alternatives should get plant-based substitutes. A default user asking the same question should get regular alternatives. If they share a cache key, whoever hits first poisons the cache for the other.

The fix was appending a hash of the user profile to the cache key. If there is no profile, a sentinel value goes in. Vegetarian user gets a different cache slot than the default user, even for the same item.

This is a multi-tenant caching problem. The course talks about cache correctness in distributed systems. The specific shape here is: cache keys must capture all dimensions that affect the output. Input alone is not enough when the result is personalized. Missing a profile dimension in the key is functionally the same as a cache poisoning bug.

---

## What the Experiments Showed

I ran three eval scenarios across all five sync endpoints and the suggest endpoint. A few results surprised me.

The biggest surprise: cheap models (GPT-5.4 Nano at $0.20/M) matched mid-tier on four of five sync endpoints. I had assumed mid-tier was worth it everywhere. It was not. Final config: Nano as `OPENROUTER_MODEL_FAST`, Gemini 2.5 Pro as `OPENROUTER_MODEL_FULL`. That is a 3.75x cost difference, justified by data.

The second surprise was judge bias. The pair-of-judges rubric used Claude Sonnet and GPT-Mini as evaluators. Claude over-penalized GPT outputs. The scores reflected the bias, not actual quality. Cross-provider judging is now default: no judge evaluates its own provider's output.

The third thing, which was not a surprise but became undeniable: the `storeLayout` failure in the suggest endpoint is structural, not a prompt issue. The constraint is "every item from clusters and ungrouped must appear in storeLayout." LLMs fail this reliably because they predict likely output, not count items. After two prompt iterations the gap narrowed but never closed. The fix: remove storeLayout from the LLM and build it deterministically in `domains.py`. Bookkeeping in code, creativity in the LLM. Before the eval harness I would have iterated prompts indefinitely. The harness made the structural nature of the gap undeniable.

---

## Course Concepts I Actually Used

**Microservices decomposition.** The AI service is a bounded context: its own SQLite knowledge base, its own Redis broker, its own Celery worker, its own port. No shared database with user service or list service. That isolation let me iterate on the AI service implementation without coordinating with teammates. The cost is that cross-service features (pulling a real user profile from the user service) require an explicit API call, not a join. Real tradeoff, made deliberately.

**Async messaging.** The suggest endpoint queues a Celery task, returns a 202 with a job ID, and the client polls `GET /jobs/:id` every two seconds. Result stored at `ai:result:{job_id}` in Redis with a one-hour TTL. Worker and API are separate processes, decoupled by the queue. Retry logic is Celery built-in: max three retries, exponential backoff. The async job lifecycle pattern from the course, applied directly.

**JWT defense in depth.** Tokens verified at the gateway and again inside the AI service auth middleware before any route runs. Two checkpoints. If the gateway is misconfigured, the downstream service still has auth. I wrote the local middleware from scratch, which meant reading the JWT spec rather than trusting a library to do the right thing.

**Circuit breaking and graceful degradation.** The three-tier routing (Cache, then KB, then LLM) is a degradation ladder. Cache is instant and free. KB is fast and cheap. LLM is last resort. Each tier fails gracefully into the next rather than the whole request failing. This is the circuit breaker pattern, applied to inference cost rather than network failure.

**Observability.** Prometheus metrics at `/metrics` with naming convention `smartgrocery_{service}_{metric}_{unit}`. Retrofitted in Phase 3, which I would change if starting over.

---

## TDD Was Friction, Then It Wasn't

I typed through code to learn. Writing a test before writing the function felt backward for the first two weeks.

The benefit landed after Phase 1. Phase 2 changed the `alternatives` response schema: flat list of strings to structured objects with `match` and `desc` fields. Breaking change. The Phase 1 tests caught it at the domain function boundary before I ran the server.

By Phase 3, I wrote `pytest-asyncio` tests for the Celery task logic before writing `tasks.py`.

Honest take: 150+ tests missed the Gemini thinking-prefix bug. That is a prompt-contract violation, not a Python logic error. No unit test calls the real model. Coverage is a floor: it tells you what your code does given controlled inputs, not whether your prompts produce the right output from a live LLM. That gap pushed me to build the promptfoo eval harness. The two test layers serve different purposes and neither replaces the other.

---

## Eval-Driven Prompt Engineering

Before Scenario 1, prompts felt like guessing. I would write something, run it once or twice, decide it looked okay, and move on. There was no systematic way to know if a change made things better or worse.

The pair-of-judges rubric in Scenario 1 was the first time I had a number on a prompt change. Item-info on Nano went from 3/5 to 5/5 with two added lines of instruction. Alternatives went from 1/5 to 3/5. Those are concrete, reproducible scores, not impressions.

The eval configs live in `tests/eval/configs/*.yaml` under version control, alongside `domains.py`. A prompt change now means running the eval and diffing the scores. A prompt change without an eval run feels the same way a code change without a unit test feels: you are guessing.

The canonical example is the suggest endpoint. v1 prompt, all five models, 40 total test runs: 0 passes. I would have shipped v1. I would have tested it manually on two or three inputs, decided it looked reasonable, and shipped it. The harness made 0/40 undeniable. No amount of optimistic manual testing would have revealed that.

---

## Low Points

The first two weeks were plumbing. `uv` for dependency management instead of pip. OpenRouter instead of Anthropic direct. JWT middleware from scratch. Docker Compose bringing up Redis and PostgreSQL so I could run the service at all. By the end of week two I had a health endpoint and nothing else visible to show.

I know that setup time is real work. I also know it does not feel like it in the moment.

The Gemini 0/8 result was genuinely demoralizing. I had spent time on the suggest prompt. It was structured, it had clear instructions, it followed everything the other endpoints had done. Then I ran the eval and saw a full column of zeros. My first instinct was that the prompt was bad. It took me longer than it should have to actually read the raw model output and see the thinking prefix sitting there before the JSON. Once I saw it the fix was obvious. Getting to "read the raw output" was the slow part.

---

## High Points

Phase 3 async pipeline worked end-to-end on the first full run after the domain refactor. Job submitted, job ID returned, worker picked it up, result stored in Redis, poll returned the completed JSON. I ran it expecting something to be broken and it was not. That was a good moment.

Phase A eval results were the other one. The discovery that cheap models (Nano at $0.20/M) were competitive on four of five endpoints made the cost model concrete in a way it had not been before. "Use the cheapest model that passes" is a simple rule. The eval gave me the data to apply it.

---

## What I Would Do Differently

Three things, no more.

First: land the eval harness before Phase 2, not after Phase 3. I would have had Scenario 1 results in hand when I was writing the Phase 2 prompts. Instead I wrote those prompts on intuition and only measured them later. The harness should have been infrastructure from day one.

Second: wire the Prometheus `ai_tier_hits_total` counter from the start of Phase 1. Retrofitting metrics is annoying and the gaps in historical data are permanent. If the metric existed from day one, I would have had actual tier hit rate data from every test run.

Third: timebox model comparison with a "cheapest that passes" stopping rule. I spent time evaluating models that were never serious candidates. A cleaner rule would have been: start with the cheapest option, run the eval, if it passes you are done, if it fails step up one tier.

---

## Where I Would Go Next

Phase 4 is the KB module: SQLite with FTS5, tier routing that checks KB before calling the LLM. Phase 5 is Redis as Tier 1 cache plus Locust load testing. The `storeLayout` code-side construction from the suggest eval is first, though. One function change in `domains.py`, deterministically correct from there.
