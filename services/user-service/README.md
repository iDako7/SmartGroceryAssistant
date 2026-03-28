# User Service

Authentication and profile management microservice built with Go, Gin, and PostgreSQL.

**Port:** `4001` (default) | **Database:** `user_db` (PostgreSQL)

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/api/v1/users/register` | No | Register new user |
| POST | `/api/v1/users/login` | No | Login, returns JWT |
| GET | `/api/v1/users/me` | JWT | Get current user profile |
| PUT | `/api/v1/users/me` | JWT | Update current user profile |

## Architecture

```
cmd/main.go                       # Entry point, dependency wiring, route setup
internal/
  handler/handler.go              # HTTP layer — parse requests, map errors to status codes
  service/user_service.go         # Business logic — auth, hashing, JWT, DTO transforms
  repository/user_repo.go         # Data access — raw SQL via pgx
  model/user.go                   # DB entities, request DTOs, response views
  middleware/auth.go              # JWT authentication middleware
```

### Dependency Flow

```
main.go wires everything via constructors:

  db := pgxpool.New(dbURL)
  repo := repository.NewUserRepo(db)
  svc  := service.NewUserService(repo, jwtSecret)
  h    := handler.New(svc)
```

Each layer depends only on the one below it through interfaces, never concrete types.

## Patterns

### 1. Interface-Based Dependency Injection

Each layer defines an interface for what it needs from the layer below. The handler owns `userServicer`, the service owns `UserRepository`. This enables mocking at every boundary.

```go
// handler.go — handler defines what it needs from the service
type userServicer interface {
    Register(ctx context.Context, req model.RegisterRequest) (*model.AuthResponse, error)
    Login(ctx context.Context, req model.LoginRequest) (*model.AuthResponse, error)
    GetProfile(ctx context.Context, userID string) (*model.ProfileView, error)
    UpdateProfile(ctx context.Context, userID string, req model.UpdateProfileRequest) (*model.ProfileView, error)
}

// Compile-time check that *service.UserService satisfies the interface
var _ userServicer = (*service.UserService)(nil)
```

```go
// user_service.go — service defines what it needs from the repository
type UserRepository interface {
    CreateUser(ctx context.Context, email, passwordHash string) (*model.User, error)
    GetUserByEmail(ctx context.Context, email string) (*model.User, error)
    GetUserByID(ctx context.Context, id string) (*model.User, error)
    CreateProfile(ctx context.Context, user model.User) (*model.Profile, error)
    GetProfileByUserID(ctx context.Context, userID string) (*model.Profile, error)
    UpdateProfile(ctx context.Context, userID string, req model.UpdateProfileRequest) (*model.Profile, error)
}
```

### 2. Three-Tier DTO Pattern (Model Layer)

The model package separates concerns into three struct categories:

**DB Entities** — map to database columns, use `db:` tags and `pgtype.UUID` for binary UUIDs:
```go
type User struct {
    ID           pgtype.UUID `db:"id"`
    Email        string      `db:"email"`
    PasswordHash string      `db:"password_hash"`
    CreatedAt    time.Time   `db:"created_at"`
    UpdatedAt    time.Time   `db:"updated_at"`
}
```

**Request DTOs** — use `json:` tags for parsing and `binding:` tags for validation:
```go
type RegisterRequest struct {
    Email    string `json:"email"    binding:"required,email"`
    Password string `json:"password" binding:"required,min=8"`
}
```

**Response Views** — exclude sensitive fields (password hash, timestamps). ID is `string` (formatted UUID), not `pgtype.UUID`:
```go
type ProfileView struct {
    ID                  string   `json:"id"`
    Email               string   `json:"email"`
    LanguagePreference  string   `json:"language_preference"`
    DietaryRestrictions []string `json:"dietary_restrictions"`
    HouseholdSize       int16    `json:"household_size"`
    TastePreferences    string   `json:"taste_preferences"`
}
```

### 3. Handler Pattern (HTTP Layer)

Every handler follows this flow:
1. Bind/validate JSON request body via `c.ShouldBindJSON(&req)`
2. Extract `userID` from Gin context (set by auth middleware) for protected routes
3. Call service method, passing `c.Request.Context()` for cancellation propagation
4. Map service errors to HTTP status codes, return JSON response

```go
func (h *Handler) Register(c *gin.Context) {
    var req model.RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})     // 400
        return
    }
    resp, err := h.svc.Register(c.Request.Context(), req)
    if err != nil {
        if errors.Is(err, service.ErrEmailTaken) {
            c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})  // 409
            return
        }
        c.JSON(http.StatusInternalServerError, gin.H{"error": "registration failed"})  // 500
        return
    }
    c.JSON(http.StatusCreated, resp)  // 201
}
```

**Error-to-status mapping:**
| Service Error | HTTP Status |
|--------------|-------------|
| `ErrEmailTaken` | 409 Conflict |
| `ErrInvalidCreds` | 401 Unauthorized |
| JSON parse/validation | 400 Bad Request |
| All other errors | 500 Internal Server Error |

### 4. Sentinel Error Pattern (Service Layer)

The service defines named errors for known business failures. Handlers use `errors.Is()` to match them:

```go
var (
    ErrEmailTaken   = errors.New("email already registered")
    ErrInvalidCreds = errors.New("invalid email or password")
)
```

Database errors are translated to domain errors in the service layer:
- PostgreSQL SQLSTATE `23505` (unique violation) -> `ErrEmailTaken`
- `pgx.ErrNoRows` (user not found during login) -> `ErrInvalidCreds` (intentionally vague to avoid leaking user existence)

```go
func isUniqueViolation(err error) bool {
    return err != nil && strings.Contains(err.Error(), "23505")
}
```

### 5. Password Hashing

Registration hashes with `bcrypt.DefaultCost`:
```go
hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
```

Login verifies with constant-time comparison:
```go
bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
```

### 6. JWT Issuance and Verification

**Issuance** (service layer) — HS256, 7-day expiry:
```go
claims := jwt.MapClaims{
    "sub": userIDStr,                              // subject = user UUID
    "exp": time.Now().Add(7 * 24 * time.Hour).Unix(),  // expiration
    "iat": time.Now().Unix(),                      // issued at
}
jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(s.jwtSecret))
```

**Verification** (middleware) — closure captures secret, enforces HMAC algorithm:
```go
func Auth(jwtSecret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. Extract "Bearer <token>" from Authorization header
        // 2. Parse and validate (checks HMAC signing method + expiry)
        // 3. Extract claims, set c.Set("userID", claims["sub"])
        // 4. c.Next() or c.AbortWithStatusJSON(401, ...)
    }
}
```

### 7. UUID Formatting

PostgreSQL stores UUIDs as 16 bytes (`pgtype.UUID`). The service converts to standard hyphenated string for API responses and JWT claims:

```go
userIDStr := fmt.Sprintf("%x-%x-%x-%x-%x",
    user.ID.Bytes[0:4], user.ID.Bytes[4:6],
    user.ID.Bytes[6:8], user.ID.Bytes[8:10],
    user.ID.Bytes[10:16])
```

### 8. Raw SQL with Parameterized Queries (Repository Layer)

No ORM. All queries use `pgxpool.Pool` with `$1, $2` placeholders to prevent SQL injection.

**Single-row reads** use `QueryRow` + `Scan`:
```go
r.db.QueryRow(ctx,
    `SELECT id, email, password_hash, created_at, updated_at
     FROM users WHERE email = $1`, email,
).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt, &u.UpdatedAt)
```

**Inserts** use `RETURNING` to get the created row back:
```go
r.db.QueryRow(ctx,
    `INSERT INTO users (email, password_hash) VALUES ($1, $2)
     RETURNING id, email, password_hash, created_at, updated_at`,
    email, passwordHash,
).Scan(...)
```

**Partial updates** use `COALESCE`/`CASE` to only modify provided fields:
```go
`UPDATE profiles
 SET language_preference  = COALESCE(NULLIF($2, ''), language_preference),
     dietary_restrictions = CASE WHEN $3::text[] IS NOT NULL THEN $3 ELSE dietary_restrictions END,
     household_size       = CASE WHEN $4 > 0 THEN $4 ELSE household_size END,
     taste_preferences    = COALESCE(NULLIF($5, ''), taste_preferences),
     updated_at           = NOW()
 WHERE user_id = $1
 RETURNING ...`
```

**Error wrapping** preserves the original error for upstream `errors.Is()` checks:
```go
return nil, fmt.Errorf("create user: %w", err)
```

### 9. Environment Configuration

```go
func mustEnv(key string) string    // Fatal if missing — used for USER_DB_URL, JWT_SECRET
func getEnv(key, fallback string)  // Optional with default — used for USER_SERVICE_PORT
```

`godotenv.Load("../../.env")` loads from project root. Failure is silently ignored (env vars may be set externally in production).

## Testing Patterns

### Test Structure

Tests exist at two layers: handler (`handler_test.go`, 11 tests) and service (`user_service_test.go`, 7 tests) plus middleware (`auth_test.go`, 6 tests).

### Mock Creation

Each test file creates a mock struct embedding `testify/mock.Mock` that implements the layer's interface:

```go
type mockUserSvc struct{ mock.Mock }

func (m *mockUserSvc) Register(ctx context.Context, req model.RegisterRequest) (*model.AuthResponse, error) {
    args := m.Called(ctx, req)
    if args.Get(0) == nil {       // Nil-safe: testify panics on nil type assertion
        return nil, args.Error(1)
    }
    return args.Get(0).(*model.AuthResponse), args.Error(1)
}
```

### Handler Test Setup

A helper wires up a Gin router with a fake auth middleware that injects a test `userID`:

```go
func newRouter(svc *mockUserSvc) *gin.Engine {
    r := gin.New()
    h := handler.New(svc)
    r.POST("/api/v1/users/register", h.Register)
    // Protected routes use fake auth
    auth := r.Group("/api/v1/users")
    auth.Use(func(c *gin.Context) {
        c.Set("userID", "test-user-id")
        c.Next()
    })
    auth.GET("/me", h.GetProfile)
    return r
}
```

HTTP helpers (`post`, `get`, `put`) use `httptest.NewRecorder` + `httptest.NewRequest`:
```go
func post(r *gin.Engine, path, body string) *httptest.ResponseRecorder {
    w := httptest.NewRecorder()
    req := httptest.NewRequest(http.MethodPost, path, bytes.NewBufferString(body))
    req.Header.Set("Content-Type", "application/json")
    r.ServeHTTP(w, req)
    return w
}
```

### Test Categories

Each handler/service method is tested for:
- **Success path** — happy flow with expected response
- **Validation errors** — bad JSON, missing required fields (400)
- **Business errors** — email taken (409), invalid credentials (401)
- **Infrastructure errors** — simulated DB failures (500)

### Assertions

```go
assert.Equal(t, http.StatusCreated, w.Code)     // Status code
assert.Contains(t, w.Body.String(), "tok")       // Response body
svc.AssertExpectations(t)                         // All expected calls made
svc.AssertNotCalled(t, "Register")                // Service never reached
assert.ErrorIs(t, err, service.ErrEmailTaken)     // Specific error type
```

## Running

```bash
# Prerequisites: USER_DB_URL, JWT_SECRET env vars (or ../../.env file)
go run ./cmd/main.go

# Tests
go test ./...                        # All tests
go test ./internal/handler/...       # Handler tests only
go test -v -run TestHandler_Register # Single test by name
```
