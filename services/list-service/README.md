# List Service

Grocery list management microservice with CRUD for sections and items, built with Go, Gin, PostgreSQL, and RabbitMQ.

**Port:** `4002` (default) | **Database:** `list_db` (PostgreSQL) | **Broker:** RabbitMQ

## API Endpoints

All routes require JWT authentication.

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | `/health` | 200 | Health check (no auth) |
| GET | `/api/v1/lists/full` | 200 | Full list with nested sections and items |
| GET | `/api/v1/lists/sections` | 200 | All sections for current user |
| POST | `/api/v1/lists/sections` | 201 | Create section |
| PUT | `/api/v1/lists/sections/:id` | 200 | Update section |
| DELETE | `/api/v1/lists/sections/:id` | 204 | Soft-delete section |
| GET | `/api/v1/lists/sections/:id/items` | 200 | Items in a section |
| POST | `/api/v1/lists/sections/:id/items` | 201 | Create item in section |
| PUT | `/api/v1/lists/items/:id` | 200 | Update item |
| DELETE | `/api/v1/lists/items/:id` | 204 | Soft-delete item |

## Architecture

```
cmd/main.go                         # Entry point, dependency wiring, route setup
internal/
  handler/handler.go                # HTTP layer — parse requests, return responses
  service/list_service.go           # Business logic — CRUD orchestration, event publishing
  repository/list_repo.go           # Data access — raw SQL, ownership checks, soft deletes
  model/list.go                     # DB entities, request DTOs, response views
  middleware/auth.go                # JWT authentication middleware
  events/publisher.go               # RabbitMQ event publishing
```

### Dependency Flow

```
main.go wires everything via constructors:

  db  := pgxpool.New(dbURL)
  pub := events.NewPublisher(amqpURL)
  repo := repository.NewListRepo(db)
  svc  := service.NewListService(repo, pub)    // Two dependencies: repo + publisher
  h    := handler.New(svc)
```

Key difference from user-service: the service layer has **two** dependencies — the repository and the event publisher.

## Patterns

### 1. Interface-Based Dependency Injection

Same pattern as user-service. Each layer defines an interface for what it needs:

```go
// handler.go — handler defines what it needs from the service
type listServicer interface {
    GetFullList(ctx context.Context, userID string) (*model.FullListResponse, error)
    GetSections(ctx context.Context, userID string) ([]model.SectionView, error)
    CreateSection(ctx context.Context, userID string, req model.CreateSectionRequest) (*model.SectionView, error)
    // ... 6 more methods
}

var _ listServicer = (*service.ListService)(nil)  // Compile-time check
```

```go
// list_service.go — service defines TWO interfaces
type ListRepository interface {
    GetSections(ctx context.Context, userID string) ([]model.Section, error)
    CreateSection(ctx context.Context, userID, name string, position int) (*model.Section, error)
    // ... 7 more methods
}

type EventPublisher interface {
    Publish(ctx context.Context, userID string, eventType events.EventType, payload any)
}
```

### 2. Three-Tier DTO Pattern (Model Layer)

**DB Entities** — use plain `string` IDs (not `pgtype.UUID` like user-service) and support soft deletes:
```go
type Section struct {
    ID        string     `db:"id"`
    UserID    string     `db:"user_id"`
    Name      string     `db:"name"`
    Position  int        `db:"position"`
    DeletedAt *time.Time `db:"deleted_at"`   // nil = active, non-nil = soft-deleted
    CreatedAt time.Time  `db:"created_at"`
    UpdatedAt time.Time  `db:"updated_at"`
}
```

**Request DTOs** — use pointer types for optional update fields:
```go
type CreateSectionRequest struct {
    Name     string `json:"name"     binding:"required"`  // Required on create
    Position int    `json:"position"`
}

type UpdateSectionRequest struct {
    Name     string `json:"name"`       // Optional — empty string means "don't change"
    Position *int   `json:"position"`   // Pointer — nil means "don't change"
}

type UpdateItemRequest struct {
    NameEn        string  `json:"name_en"`
    NameSecondary *string `json:"name_secondary"`
    Quantity      *int    `json:"quantity"`
    Checked       *bool   `json:"checked"`     // Pointer distinguishes "false" from "not provided"
}
```

**Response Views** — exclude `UserID` and `DeletedAt`. Items nested via `omitempty`:
```go
type SectionView struct {
    ID        string     `json:"id"`
    Name      string     `json:"name"`
    Position  int        `json:"position"`
    Items     []ItemView `json:"items,omitempty"`  // Populated only in GetFullList
    CreatedAt time.Time  `json:"created_at"`
    UpdatedAt time.Time  `json:"updated_at"`
}
```

### 3. Handler Pattern (HTTP Layer)

Same flow as user-service with a shared `userID()` helper:

```go
func userID(c *gin.Context) string {
    v, _ := c.Get("userID")
    return v.(string)
}
```

All handlers follow: bind JSON -> call service -> map error -> return response.

**Unlike user-service**, list-service has no sentinel error matching — all service errors map to 500:
```go
func (h *Handler) CreateSection(c *gin.Context) {
    var req model.CreateSectionRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    section, err := h.svc.CreateSection(c.Request.Context(), userID(c), req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create section"})
        return
    }
    c.JSON(http.StatusCreated, section)
}
```

**Response conventions:**
| Operation | Status | Body |
|-----------|--------|------|
| Create | 201 | Created entity |
| Read (single) | 200 | Entity |
| Read (list) | 200 | `{"sections": [...]}` or `{"items": [...]}` (wrapped) |
| Read (full list) | 200 | `FullListResponse` (sections with nested items) |
| Update | 200 | Updated entity |
| Delete | 204 | No body |

### 4. Soft Delete Pattern

Records are never hard-deleted. Deletes set `deleted_at = NOW()`:

```go
// Repository — soft delete
`UPDATE sections SET deleted_at = NOW(), updated_at = NOW()
 WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`

// Idempotency check — error if already deleted or doesn't exist
if tag.RowsAffected() == 0 {
    return fmt.Errorf("section not found")
}
```

All read queries filter out deleted records:
```sql
WHERE user_id = $1 AND deleted_at IS NULL
```

### 5. User Ownership Enforcement (Repository Layer)

Every query includes the `userID` in its WHERE clause to prevent cross-user access (IDOR protection).

**Sections** — direct ownership:
```sql
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
```

**Items** — ownership via JOIN to parent section:
```sql
UPDATE items SET ...
FROM sections s
WHERE items.id = $1 AND items.section_id = s.id AND s.user_id = $6 AND items.deleted_at IS NULL
```

**Item creation** — `INSERT ... WHERE EXISTS` ensures the section belongs to the user:
```sql
INSERT INTO items (section_id, name_en, name_secondary, quantity)
SELECT $1, $2, $3, $4
WHERE EXISTS (SELECT 1 FROM sections WHERE id = $1 AND user_id = $5 AND deleted_at IS NULL)
```

### 6. Partial Update Pattern (Repository Layer)

Uses SQL `CASE` and `COALESCE` to only update provided fields:

```sql
-- Sections: empty string means "keep current"
SET name     = CASE WHEN $3 != '' THEN $3 ELSE name END,
    position = CASE WHEN $4 IS NOT NULL THEN $4 ELSE position END

-- Items: nil pointer means "keep current"
SET name_en        = CASE WHEN $2 != '' THEN $2 ELSE name_en END,
    name_secondary = COALESCE($3, name_secondary),
    quantity       = COALESCE($4, quantity),
    checked        = COALESCE($5, checked)
```

### 7. Event Publishing Pattern

Write operations (create, update, delete) publish events to RabbitMQ after the DB operation succeeds. Events are **fire-and-forget** — publish failures are logged but don't fail the request.

**Event types:**
```go
const (
    SectionCreated EventType = "section.created"
    SectionUpdated EventType = "section.updated"
    SectionDeleted EventType = "section.deleted"
    ItemCreated    EventType = "item.created"
    ItemUpdated    EventType = "item.updated"
    ItemDeleted    EventType = "item.deleted"
)
```

**Event envelope:**
```go
type ListEvent struct {
    Type    EventType `json:"type"`
    UserID  string    `json:"user_id"`
    Payload any       `json:"payload"`   // Full entity for create/update, {"id": "..."} for delete
}
```

**Publishing is done in the service layer**, not the handler or repository:
```go
func (s *ListService) CreateSection(ctx context.Context, userID string, req model.CreateSectionRequest) (*model.SectionView, error) {
    sec, err := s.repo.CreateSection(ctx, userID, req.Name, req.Position)
    if err != nil {
        return nil, err           // No event published on failure
    }
    s.pub.Publish(ctx, userID, events.SectionCreated, sec)   // Fire-and-forget
    v := toSectionView(*sec)
    return &v, nil
}
```

**RabbitMQ config:**
- Exchange: `"list"` (hardcoded)
- Delivery mode: `amqp.Persistent` (survives broker restart)
- Content type: `application/json`
- Errors: logged via `log.Printf`, never returned to caller

### 8. DTO Transformation Helpers

The service layer converts DB entities to response views using private helpers:

```go
func toSectionView(s model.Section) model.SectionView {
    return model.SectionView{
        ID: s.ID, Name: s.Name, Position: s.Position,
        CreatedAt: s.CreatedAt, UpdatedAt: s.UpdatedAt,
        // UserID and DeletedAt excluded
    }
}

func toItemView(i model.Item) model.ItemView {
    return model.ItemView{
        ID: i.ID, SectionID: i.SectionID, NameEn: i.NameEn,
        NameSecondary: i.NameSecondary, Quantity: i.Quantity,
        Checked: i.Checked, CreatedAt: i.CreatedAt, UpdatedAt: i.UpdatedAt,
    }
}
```

`GetFullList` assembles the nested response by populating each section's `Items` slice:
```go
for i, sec := range sections {
    v := toSectionView(sec)
    items := itemsBySection[sec.ID]
    v.Items = make([]model.ItemView, len(items))
    for j, item := range items {
        v.Items[j] = toItemView(item)
    }
    views[i] = v
}
```

### 9. Raw SQL with Parameterized Queries (Repository Layer)

Same approach as user-service. No ORM. `pgxpool.Pool` with `$1, $2` placeholders.

**Multi-row reads** use `Query` + row iteration + `defer rows.Close()`:
```go
rows, err := r.db.Query(ctx,
    `SELECT id, user_id, name, position, deleted_at, created_at, updated_at
     FROM sections WHERE user_id = $1 AND deleted_at IS NULL
     ORDER BY position, created_at`, userID)
defer rows.Close()

var sections []model.Section
for rows.Next() {
    var s model.Section
    rows.Scan(&s.ID, &s.UserID, &s.Name, &s.Position, &s.DeletedAt, &s.CreatedAt, &s.UpdatedAt)
    sections = append(sections, s)
}
return sections, rows.Err()
```

**Default values** applied at repository level:
```go
qty := 1
if req.Quantity > 0 {
    qty = req.Quantity
}
```

### 10. JWT Authentication Middleware

Identical to user-service. Closure captures the JWT secret, validates Bearer tokens with HMAC-SHA256, and sets `userID` in Gin context:

```go
func Auth(jwtSecret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. Extract "Bearer <token>" from Authorization header
        // 2. jwt.Parse with HMAC signing method enforcement
        // 3. c.Set("userID", claims["sub"])
        // 4. c.Next() or c.AbortWithStatusJSON(401, ...)
    }
}
```

Applied to all list routes as a group:
```go
lists := r.Group("/api/v1/lists", middleware.Auth(jwtSecret))
```

### 11. Environment Configuration

```go
func mustEnv(key string) string    // Fatal if missing — LIST_DB_URL, JWT_SECRET
func getEnv(key, fallback string)  // Optional with default — RABBITMQ_URL, LIST_SERVICE_PORT
```

## Testing Patterns

### Test Structure

Tests exist at two layers: handler (`handler_test.go`) and service (`list_service_test.go`).

### Mock Creation

Two mock types per test file — one for the repository, one for the event publisher:

```go
type mockListRepo struct{ mock.Mock }

func (m *mockListRepo) CreateSection(ctx context.Context, userID, name string, position int) (*model.Section, error) {
    args := m.Called(ctx, userID, name, position)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*model.Section), args.Error(1)
}

type mockPublisher struct{ mock.Mock }

func (m *mockPublisher) Publish(ctx context.Context, userID string, eventType events.EventType, payload any) {
    m.Called(ctx, userID, eventType, payload)
}
```

### Handler Test Setup

Generic `doRequest` helper handles all HTTP methods:
```go
func doRequest(r *gin.Engine, method, path, body string) *httptest.ResponseRecorder {
    w := httptest.NewRecorder()
    var req *http.Request
    if body != "" {
        req = httptest.NewRequest(method, path, bytes.NewBufferString(body))
        req.Header.Set("Content-Type", "application/json")
    } else {
        req = httptest.NewRequest(method, path, nil)
    }
    r.ServeHTTP(w, req)
    return w
}
```

### Event Publishing Verification

Tests verify that events are published on success and **not** published on failure:

```go
// Success: event published
pub.On("Publish", mock.Anything, "user-1", events.SectionCreated, mock.Anything).Return()
// ... call service ...
pub.AssertCalled(t, "Publish", mock.Anything, "user-1", events.SectionCreated, mock.Anything)

// Error: event NOT published
repo.On("CreateSection", ...).Return(nil, errors.New("db error"))
// ... call service ...
pub.AssertNotCalled(t, "Publish")
```

### Test Categories

- **Success paths** — verify correct DTO transformation and response body
- **Service errors** — verify 500 status and service not called on bad input
- **Validation errors** — bad JSON (400), missing required fields (400)
- **Event publishing** — verify events fire on success, don't fire on error

## Key Differences from User Service

| Aspect | User Service | List Service |
|--------|-------------|--------------|
| ID type | `pgtype.UUID` (binary) | `string` |
| Soft deletes | No | Yes (`deleted_at` column) |
| Sentinel errors | `ErrEmailTaken`, `ErrInvalidCreds` | None (generic errors) |
| Event publishing | No | Yes (RabbitMQ, fire-and-forget) |
| Service dependencies | repo + jwtSecret | repo + EventPublisher |
| Public routes | `/register`, `/login` | None (all protected) |
| Ownership check | Direct `WHERE user_id = $1` | Direct for sections, JOIN for items |
| Multi-row queries | Not needed | `Query` + row iteration pattern |

## Running

```bash
# Prerequisites: LIST_DB_URL, JWT_SECRET env vars (or ../../.env file)
# Optional: RABBITMQ_URL (defaults to amqp://sga:sga_secret@localhost:5672/)
go run ./cmd/main.go

# Tests
go test ./...                          # All tests
go test ./internal/handler/...         # Handler tests only
go test -v -run TestHandler_CreateSection  # Single test by name
```
