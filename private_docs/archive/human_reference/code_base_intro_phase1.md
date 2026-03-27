

1. Purpose of this document: Help people who is unfamiliar with this project, like new boarding programmer and outside reviewer to quickly understand the business logic, the code base architecture with tech stack decision and the major code logic
2. Automatically generate overall architecture, then with user's permission to generate the detail architecture introduction



## overall architecture

### business logic overview

[purpose of this part: Help people understand what the code base is doing in common sense, like PRD, but in a very concise way]



[proposing structure:

-  one or several  UML diagram to illustrate the business logic flow. 
- The number of the diagram should be as less as possible while maintaining  the clarity
- Each diagram should be accompanied by a very concise explanation which define the module 
- a feature list for each diagram. The format of each feature should be like FR-1-name

]





### System architecture 

[purpose of this part: Help people understand the system architecture, the major tech stack]



[ output: 

The output should have 2 parts

-  one  diagram to illustrate architecture
- Concise introduction to each component on: (1) its functionality (2) tech stack

]



[here is an example of the diagram

<img src="/Users/dako/Library/Application Support/typora-user-images/image-20260324181850152.png" alt="image-20260324181850152" style="zoom:40%;" />

]



## detail architecture introduction

[purpose of this part: help people understand more deeply on how each part is working with more logic detail]



[structure:

- How to divide the whole architecture into different modules: The module's relationship should follow the MECE principle from pyramid principle.
- Each module should at least contain following parts: Implemented features, Module map, Code detail

]



[examples

1. Implemented features

```text
The AI Service delivers four features, split into two categories by how they execute:
Synchronous (client waits, gets answer immediately):

"What is this item?" — tap Item Info on "Ranch Dressing" → get category, storage tip, nutrition note
"How do I say this in Chinese?" — tap Translate on "Chicken Breast" → get "鸡胸肉"
"What can I use instead?" — tap Alternatives on "Butter" → get "Margarine, Coconut Oil, Ghee"

Asynchronous (client gets job ID, polls for result):

"What else should I buy?" — tap Suggest on a section → get 5-10 recommended items (you just walked through this one)
"What can I cook with this?" — tap Inspire → get 3 meal ideas with missing ingredients

The split exists because Suggest and Inspire need longer, more creative LLM prompts (~1024 tokens, 5-10s). The sync features use shorter prompts (~512 tokens, 1-2s) and cache aggressively.
```



2.Module map

<img src="/Users/dako/Library/Application Support/typora-user-images/image-20260324184319400.png" alt="image-20260324184319400" style="zoom:50%;" />





3. Module-by-module

````markdown

## Module-by-module

### Routes — the entry point that splits into two paths

```python
# routes/ai.py
# This module is a fork in the road: sync requests go DOWN to Claude,
# async requests go RIGHT to Queue.

# ── Sync path: Routes → Claude module → response ─────────
POST /translate     →  claude.translate_item(name, lang)   →  return to client
POST /item-info     →  claude.item_info(name)              →  return to client
POST /alternatives  →  claude.alternatives(name, reason)   →  return to client

# ── Async path: Routes → Queue module → return ticket ────
POST /suggest   →  queue.publish_job("suggest", payload)   →  return {job_id}
POST /inspire   →  queue.publish_job("inspire", payload)   →  return {job_id}

# ── Reconnect path: Client comes back with the ticket ────
GET /jobs/{id}  →  cache.get("ai:result:{id}")             →  return result
#                  ↑ reads what the Worker wrote earlier
```

### Claude module — shared LLM logic used by both paths

```python
# services/claude.py
# Called by Routes (sync methods) and by Worker (async methods).
# Two types of methods, same LLM call, different caching strategy.

# ── Sync methods (Routes calls these) ────────────────────
# Pattern: check Redis cache → if miss, call LLM → store in cache → return
# Cache key is based on the item name, so "Milk info" is only computed once.

func translate_item(name, lang)   →  _call(prompt, cache_key, ttl=24h)  →  parse JSON
func item_info(name)              →  _call(prompt, cache_key, ttl=24h)  →  parse JSON
func alternatives(name, reason)   →  _call(prompt, cache_key, ttl=1h)   →  parse JSON

# ── Async methods (Worker calls these, NOT Routes) ───────
# No cache check here — the Worker stores the raw result under job_id.
# Longer LLM budget (1024 tokens vs 512) because these need creative output.

func suggest_items(sections)              →  call LLM  →  return raw string to Worker
func inspire_meals(sections, preferences) →  call LLM  →  return raw string to Worker
#                                                         ↑ Worker writes to Redis
```

### Cache + Queue — two infrastructure bridges

```python
# services/cache.py — Bridge to Redis
# Used by Claude module (sync caching) AND by Worker (storing job results).
# Same Redis instance, different key patterns:
#   Sync cache:  "ai:translate:{hash}"  →  keyed by item name
#   Job results: "ai:result:{job_id}"   →  keyed by job ID

func cache_get(key)             →  redis.GET
func cache_set(key, value, ttl) →  redis.SET with expiration

# services/queue.py — Bridge to RabbitMQ
# Used by Routes to hand off async jobs. The Worker on the other
# side of this queue is a separate process.

func publish_job(type, payload) →  generate job_id
                                →  publish {job_id, type, payload} to queue
                                →  return job_id (Routes sends this to client)
```

### Worker — the other side of the queue

```python
# worker.py — Separate Python process, runs alongside AI Service.
# Imports Claude module and Cache module from the same codebase.
# Connects the async path: Queue → Worker → Claude → Cache → polled by client.

func process(message):
    { job_id, type, payload } = parse(message)

    # Route to the correct Claude async method
    if type == "suggest":  result = claude.suggest_items(payload.sections)
    if type == "inspire":  result = claude.inspire_meals(payload.sections, prefs)

    # Store result where the poll endpoint can find it
    cache.set("ai:result:{job_id}", result, ttl=1h)
    # ↑ This is what GET /jobs/{id} in Routes reads
```

The full async circle: Routes publishes to Queue → RabbitMQ delivers to Worker → Worker calls Claude module → Worker writes to Cache → client polls Routes → Routes reads from Cache.
````



]



