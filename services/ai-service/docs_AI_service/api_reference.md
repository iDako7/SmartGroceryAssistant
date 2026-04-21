# AI Service — API Reference

Base URL: `http://localhost:4003` (dev) | Via Gateway: `http://localhost:3001/api/v1/ai/*`

Last updated: 2026-04-02

---

## Authentication

All endpoints except `/health` require a JWT Bearer token.

```
Authorization: Bearer <jwt_token>
```

- Algorithm: HS256
- Required claim: `sub` (user ID)
- Optional claim: `exp` (expiration)

### Error Responses

| Status | When | Body |
|--------|------|------|
| 403 | No Authorization header | `{"detail": "Not authenticated"}` |
| 401 | Invalid/expired token or missing `sub` | `{"detail": "invalid token"}` |
| 422 | Missing/invalid request fields | `{"detail": [{"type": "missing", "loc": ["body", "field"], "msg": "Field required"}]}` |

---

## Shared Types

### UserProfile (optional on all endpoints)

```json
{
  "dietary": ["vegan", "gluten-free"],
  "household_size": 4,
  "taste": "prefer spicy, dislike seafood"
}
```

All fields optional. Defaults: `dietary=[]`, `household_size=0`, `taste=""`.

---

## Endpoints

### 1. GET /health

No auth required.

**Response 200:**
```json
{"status": "ok", "service": "ai-service"}
```

---

### 2. POST /api/v1/ai/translate

Translate a grocery item name to another language.

**Request:**
```json
{
  "name_en": "Milk",
  "target_language": "Chinese",
  "profile": null
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name_en | string | yes | English item name |
| target_language | string | yes | e.g. "Chinese", "Spanish", "Japanese" |
| profile | UserProfile | no | |

**Response 200:**
```json
{
  "name_translated": "牛奶",
  "notes": "Common translation used across regions"
}
```

| Field | Type | Notes |
|-------|------|-------|
| name_translated | string | always present |
| notes | string | may be empty |

---

### 3. POST /api/v1/ai/item-info

Get metadata for a grocery item.

**Request:**
```json
{
  "name_en": "Milk",
  "profile": null
}
```

| Field | Type | Required |
|-------|------|----------|
| name_en | string | yes |
| profile | UserProfile | no |

**Response 200:**
```json
{
  "category": "Dairy",
  "typical_unit": "liter",
  "storage_tip": "Keep refrigerated at 4°C",
  "nutrition_note": "Rich in calcium and vitamin D"
}
```

All response fields are strings, may be empty on fallback.

---

### 4. POST /api/v1/ai/alternatives

Suggest alternatives for a grocery item.

**Request:**
```json
{
  "name_en": "Milk",
  "reason": "dairy free",
  "profile": {"dietary": ["vegan"]}
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name_en | string | yes | |
| reason | string | no | Why alternatives needed |
| profile | UserProfile | no | |

**Response 200:**
```json
{
  "note": "Plant-based alternatives for dairy-free diets",
  "alts": [
    {
      "name_en": "Oat Milk",
      "match": "Very close",
      "desc": "Creamy plant-based milk with natural sweetness",
      "where": "Dairy aisle or plant-based section"
    },
    {
      "name_en": "Almond Milk",
      "match": "Very close",
      "desc": "Lighter alternative with subtle nutty flavor",
      "where": "Dairy aisle or plant-based section"
    },
    {
      "name_en": "Soy Milk",
      "match": "Similar",
      "desc": "High protein plant-based option",
      "where": "Plant-based section"
    }
  ]
}
```

| Field | Type | Notes |
|-------|------|-------|
| note | string | Summary of why alternatives suggested |
| alts | array | 3-4 items typically |
| alts[].name_en | string | |
| alts[].match | string | "Very close", "Similar", or "Different but works" |
| alts[].desc | string | One sentence |
| alts[].where | string | Store location hint |

---

### 5. POST /api/v1/ai/inspire/item

Generate recipe ideas around one item.

**Request:**
```json
{
  "name_en": "chicken",
  "other_items": ["rice", "garlic"],
  "profile": {"taste": "spicy"}
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name_en | string | yes | Main ingredient |
| other_items | string[] | no | Other items the user has |
| profile | UserProfile | no | |

**Response 200:**
```json
{
  "recipes": [
    {
      "name": "Spicy Garlic Chicken Stir Fry",
      "emoji": "🍳",
      "desc": "Quick weeknight Asian-inspired dinner",
      "add": [
        {"name_en": "soy sauce"},
        {"name_en": "red chili flakes"},
        {"name_en": "ginger"}
      ]
    },
    {
      "name": "Chicken Fried Rice",
      "emoji": "🍚",
      "desc": "Perfect use for day-old rice",
      "add": [
        {"name_en": "eggs"},
        {"name_en": "green onions"}
      ]
    }
  ]
}
```

| Field | Type | Notes |
|-------|------|-------|
| recipes | array | ~3 recipes |
| recipes[].name | string | Recipe name |
| recipes[].emoji | string | Single emoji |
| recipes[].desc | string | Max 8 words |
| recipes[].add | array | 2-3 items to buy |
| recipes[].add[].name_en | string | |

---

### 6. POST /api/v1/ai/clarify

Generate clarifying questions before the suggest step.

**Request:**
```json
{
  "sections": {
    "Produce": ["apples", "bananas", "garlic"],
    "Meat": ["chicken thighs", "ground beef"],
    "Dairy": ["milk", "cheese"]
  },
  "profile": null
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| sections | object | yes | Keys = section names, values = item name arrays |
| profile | UserProfile | no | |

**Response 200:**
```json
{
  "questions": [
    {
      "q": "What's the main occasion for this shopping?",
      "options": ["Weekly restock", "Party planning", "Meal prep", "Special recipe"],
      "allowOther": true
    },
    {
      "q": "Any dietary restrictions to keep in mind?",
      "options": ["None", "Vegetarian", "Gluten-free", "Low-carb"],
      "allowOther": true
    }
  ]
}
```

| Field | Type | Notes |
|-------|------|-------|
| questions | array | 1-3 questions |
| questions[].q | string | Question text |
| questions[].options | string[] | 3-4 tappable chip options (2-5 words each) |
| questions[].allowOther | boolean | Whether free-text input is allowed |

---

### 7. POST /api/v1/ai/suggest

Submit grocery list for async AI analysis. Returns immediately with a job ID.

**Status: 202 Accepted**

**Request:**
```json
{
  "sections": {
    "Produce": ["apples", "garlic", "spinach"],
    "Meat": ["chicken thighs"],
    "Dairy": ["milk"]
  },
  "answers": [
    {"question": "What's the main occasion?", "answer": "Weeknight dinners"}
  ],
  "profile": {
    "dietary": ["gluten-free"],
    "household_size": 4,
    "taste": "mild"
  }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| sections | object | yes | Same format as clarify |
| answers | array | no | Answers from clarify step |
| answers[].question | string | yes (if answers provided) | Original question text |
| answers[].answer | string | yes (if answers provided) | User's answer |
| profile | UserProfile | no | |

**Response 202:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending"
}
```

---

### 8. GET /api/v1/ai/jobs/{job_id}

Poll for async job result.

**Path parameter:** `job_id` (string, UUID)

**Response 200 — Pending/Processing:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending"
}
```

Status values: `"pending"`, `"processing"`, `"done"`, `"failed"`

**Response 200 — Done:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "done",
  "result": {
    "reason": "Weeknight dinners with Asian-inspired flavors",
    "clusters": [
      {
        "name": "Chicken Stir Fry",
        "emoji": "🍳",
        "desc": "Quick weeknight Asian-inspired meal",
        "items": [
          {"name_en": "chicken thighs", "existing": true},
          {"name_en": "garlic", "existing": true},
          {"name_en": "spinach", "existing": true},
          {"name_en": "soy sauce", "existing": false, "why": "Essential stir fry base"},
          {"name_en": "ginger", "existing": false, "why": "Adds authentic flavor"}
        ]
      },
      {
        "name": "Apple Spinach Salad",
        "emoji": "🥗",
        "desc": "Light fresh side dish",
        "items": [
          {"name_en": "apples", "existing": true},
          {"name_en": "spinach", "existing": true},
          {"name_en": "walnuts", "existing": false, "why": "Adds crunch and protein"}
        ]
      }
    ],
    "ungrouped": [
      {"name_en": "milk", "existing": true}
    ],
    "storeLayout": [
      {
        "category": "Produce",
        "emoji": "🥬",
        "items": [
          {"name_en": "apples", "existing": true},
          {"name_en": "garlic", "existing": true},
          {"name_en": "ginger", "existing": false},
          {"name_en": "spinach", "existing": true}
        ]
      },
      {
        "category": "Meat",
        "emoji": "🍗",
        "items": [
          {"name_en": "chicken thighs", "existing": true}
        ]
      },
      {
        "category": "Condiments",
        "emoji": "🧂",
        "items": [
          {"name_en": "soy sauce", "existing": false}
        ]
      },
      {
        "category": "Snacks & Nuts",
        "emoji": "🥜",
        "items": [
          {"name_en": "walnuts", "existing": false}
        ]
      },
      {
        "category": "Dairy",
        "emoji": "🥛",
        "items": [
          {"name_en": "milk", "existing": true}
        ]
      }
    ]
  }
}
```

**Result schema:**

| Field | Type | Notes |
|-------|------|-------|
| reason | string | 1-sentence analysis summary |
| clusters | array | 2-4 meal idea groups |
| clusters[].name | string | Meal name |
| clusters[].emoji | string | Single emoji |
| clusters[].desc | string | 1-sentence description |
| clusters[].items | array | Mix of existing and new items |
| clusters[].items[].name_en | string | |
| clusters[].items[].existing | boolean | true = from original list |
| clusters[].items[].why | string | Reason for new items (empty for existing) |
| ungrouped | array | Original items not in any cluster |
| ungrouped[].name_en | string | |
| ungrouped[].existing | boolean | Usually true |
| storeLayout | array | All items organized by store aisle |
| storeLayout[].category | string | Aisle name |
| storeLayout[].emoji | string | |
| storeLayout[].items | array | |
| storeLayout[].items[].name_en | string | |
| storeLayout[].items[].existing | boolean | |

**Response 200 — Failed:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "failed",
  "error": "API rate limit exceeded"
}
```

**Response 404:**
```json
{"detail": "Job not found"}
```

---

## Async Suggest Flow (Full Lifecycle)

```
Client                          AI Service                    Celery Worker
  │                                │                              │
  ├─ POST /clarify ───────────────►│                              │
  │◄── 200 {questions} ───────────┤                              │
  │                                │                              │
  │  (user answers questions)      │                              │
  │                                │                              │
  ├─ POST /suggest ───────────────►│                              │
  │◄── 202 {job_id, "pending"} ───┤──── task queued ────────────►│
  │                                │                              │
  │  (poll loop)                   │                              ├─ status→"processing"
  ├─ GET /jobs/{id} ──────────────►│                              │
  │◄── 200 {"processing"} ────────┤                              ├─ LLM call...
  │                                │                              │
  ├─ GET /jobs/{id} ──────────────►│                              ├─ status→"done"
  │◄── 200 {"done", result} ──────┤                              │   result stored
  │                                │                              │
```

Recommended poll interval: 2-3 seconds. Jobs expire after 1 hour (configurable via `CELERY_RESULT_TTL`).

---

## Mock Data for Testing

### JWT Token Generation

```javascript
// Node.js (for Gateway/Frontend tests)
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: 'user-test-123', exp: Math.floor(Date.now() / 1000) + 3600 },
  'test-secret',  // must match JWT_SECRET in test env
  { algorithm: 'HS256' }
);
const headers = { Authorization: `Bearer ${token}` };
```

```python
# Python
from jose import jwt
token = jwt.encode(
    {"sub": "user-test-123", "exp": int(time.time()) + 3600},
    "test-secret", algorithm="HS256"
)
headers = {"Authorization": f"Bearer {token}"}
```

```go
// Go (for User/List service tests)
import "github.com/golang-jwt/jwt/v5"
claims := jwt.MapClaims{"sub": "user-test-123", "exp": time.Now().Add(time.Hour).Unix()}
token, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte("test-secret"))
headers := map[string]string{"Authorization": "Bearer " + token}
```

### Mock Response Fixtures

**Translate:**
```json
{"name_translated": "牛奶", "notes": ""}
```

**Item Info:**
```json
{"category": "Dairy", "typical_unit": "liter", "storage_tip": "Refrigerate", "nutrition_note": "High calcium"}
```

**Alternatives:**
```json
{"note": "Plant-based options", "alts": [{"name_en": "Oat Milk", "match": "Very close", "desc": "Creamy plant milk", "where": "Dairy aisle"}]}
```

**Inspire:**
```json
{"recipes": [{"name": "Stir Fry", "emoji": "🍳", "desc": "Quick weeknight dinner", "add": [{"name_en": "soy sauce"}]}]}
```

**Clarify:**
```json
{"questions": [{"q": "What's the occasion?", "options": ["Weekly restock", "Party", "Meal prep"], "allowOther": true}]}
```

**Suggest (job creation):**
```json
{"job_id": "550e8400-e29b-41d4-a716-446655440000", "status": "pending"}
```

**Suggest (job done):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "done",
  "result": {
    "reason": "Weeknight meals",
    "clusters": [{"name": "Stir Fry", "emoji": "🍳", "desc": "Quick dinner", "items": [{"name_en": "chicken", "existing": true}, {"name_en": "soy sauce", "existing": false, "why": "Base flavor"}]}],
    "ungrouped": [{"name_en": "milk", "existing": true}],
    "storeLayout": [{"category": "Meat", "emoji": "🍗", "items": [{"name_en": "chicken", "existing": true}]}, {"category": "Condiments", "emoji": "🧂", "items": [{"name_en": "soy sauce", "existing": false}]}, {"category": "Dairy", "emoji": "🥛", "items": [{"name_en": "milk", "existing": true}]}]
  }
}
```
