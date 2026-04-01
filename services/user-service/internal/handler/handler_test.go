package handler_test

import (
	"bytes"
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/handler"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/model"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func init() { gin.SetMode(gin.TestMode) }

// ── Mock service ─────────────────────────────────────────

type mockUserSvc struct{ mock.Mock }

func (m *mockUserSvc) Register(ctx context.Context, req model.RegisterRequest) (*model.AuthResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.AuthResponse), args.Error(1)
}

func (m *mockUserSvc) Login(ctx context.Context, req model.LoginRequest) (*model.AuthResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.AuthResponse), args.Error(1)
}

func (m *mockUserSvc) GetProfile(ctx context.Context, userID string) (*model.ProfileView, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ProfileView), args.Error(1)
}

func (m *mockUserSvc) UpdateProfile(ctx context.Context, userID string, req model.UpdateProfileRequest) (*model.ProfileView, error) {
	args := m.Called(ctx, userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ProfileView), args.Error(1)
}

func (m *mockUserSvc) DeleteUser(ctx context.Context, userID string) error {
	return m.Called(ctx, userID).Error(0)
}

// ── Helpers ──────────────────────────────────────────────

func newRouter(svc *mockUserSvc) *gin.Engine {
	r := gin.New()
	h := handler.New(svc)
	r.POST("/api/v1/users/register", h.Register)
	r.POST("/api/v1/users/login", h.Login)
	// Protected routes — inject userID via middleware for testing
	auth := r.Group("/api/v1/users")
	auth.Use(func(c *gin.Context) {
		c.Set("userID", "test-user-id")
		c.Next()
	})
	auth.GET("/me", h.GetProfile)
	auth.PUT("/me", h.UpdateProfile)
	return r
}

func post(r *gin.Engine, path, body string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	return w
}

func get(r *gin.Engine, path string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, path, nil)
	r.ServeHTTP(w, req)
	return w
}

func put(r *gin.Engine, path, body string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, path, bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	return w
}

// ── Register ─────────────────────────────────────────────

func TestHandler_Register_Success(t *testing.T) {
	svc := new(mockUserSvc)
	r := newRouter(svc)

	svc.On("Register", mock.Anything, model.RegisterRequest{
		Email: "test@example.com", Password: "password123",
	}).Return(&model.AuthResponse{Token: "tok", User: model.ProfileView{Email: "test@example.com"}}, nil)

	w := post(r, "/api/v1/users/register", `{"email":"test@example.com","password":"password123"}`)

	assert.Equal(t, http.StatusCreated, w.Code)
	assert.Contains(t, w.Body.String(), "tok")
	svc.AssertExpectations(t)
}

func TestHandler_Register_BadJSON(t *testing.T) {
	svc := new(mockUserSvc)
	r := newRouter(svc)

	w := post(r, "/api/v1/users/register", `{invalid}`)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	svc.AssertNotCalled(t, "Register")
}

func TestHandler_Register_MissingFields(t *testing.T) {
	svc := new(mockUserSvc)
	r := newRouter(svc)

	w := post(r, "/api/v1/users/register", `{"email":"notanemail","password":"short"}`)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestHandler_Register_EmailTaken(t *testing.T) {
	svc := new(mockUserSvc)
	r := newRouter(svc)

	svc.On("Register", mock.Anything, mock.Anything).Return(nil, service.ErrEmailTaken)

	w := post(r, "/api/v1/users/register", `{"email":"taken@example.com","password":"password123"}`)

	assert.Equal(t, http.StatusConflict, w.Code)
	svc.AssertExpectations(t)
}

func TestHandler_Register_InternalError(t *testing.T) {
	svc := new(mockUserSvc)
	r := newRouter(svc)

	svc.On("Register", mock.Anything, mock.Anything).Return(nil, errors.New("db down"))

	w := post(r, "/api/v1/users/register", `{"email":"test@example.com","password":"password123"}`)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	svc.AssertExpectations(t)
}

// ── Login ────────────────────────────────────────────────

func TestHandler_Login_Success(t *testing.T) {
	svc := new(mockUserSvc)
	r := newRouter(svc)

	svc.On("Login", mock.Anything, model.LoginRequest{
		Email: "test@example.com", Password: "password123",
	}).Return(&model.AuthResponse{Token: "jwt-token"}, nil)

	w := post(r, "/api/v1/users/login", `{"email":"test@example.com","password":"password123"}`)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "jwt-token")
	svc.AssertExpectations(t)
}

func TestHandler_Login_InvalidCreds(t *testing.T) {
	svc := new(mockUserSvc)
	r := newRouter(svc)

	svc.On("Login", mock.Anything, mock.Anything).Return(nil, service.ErrInvalidCreds)

	w := post(r, "/api/v1/users/login", `{"email":"test@example.com","password":"wrongpass"}`)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	svc.AssertExpectations(t)
}

func TestHandler_Login_BadJSON(t *testing.T) {
	svc := new(mockUserSvc)
	r := newRouter(svc)

	w := post(r, "/api/v1/users/login", `not json`)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	svc.AssertNotCalled(t, "Login")
}

func TestHandler_Login_InternalError(t *testing.T) {
	svc := new(mockUserSvc)
	r := newRouter(svc)

	svc.On("Login", mock.Anything, mock.Anything).Return(nil, errors.New("db timeout"))

	w := post(r, "/api/v1/users/login", `{"email":"test@example.com","password":"password123"}`)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	svc.AssertExpectations(t)
}

// ── GetProfile ───────────────────────────────────────────

func TestHandler_GetProfile_Success(t *testing.T) {
	svc := new(mockUserSvc)
	r := newRouter(svc)

	svc.On("GetProfile", mock.Anything, "test-user-id").
		Return(&model.ProfileView{ID: "test-user-id", Email: "test@example.com"}, nil)

	w := get(r, "/api/v1/users/me")

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "test@example.com")
	svc.AssertExpectations(t)
}

func TestHandler_GetProfile_InternalError(t *testing.T) {
	svc := new(mockUserSvc)
	r := newRouter(svc)

	svc.On("GetProfile", mock.Anything, "test-user-id").Return(nil, errors.New("db error"))

	w := get(r, "/api/v1/users/me")

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	svc.AssertExpectations(t)
}

// ── UpdateProfile ────────────────────────────────────────

func TestHandler_UpdateProfile_Success(t *testing.T) {
	svc := new(mockUserSvc)
	r := newRouter(svc)

	svc.On("UpdateProfile", mock.Anything, "test-user-id", mock.Anything).
		Return(&model.ProfileView{ID: "test-user-id", LanguagePreference: "zh"}, nil)

	w := put(r, "/api/v1/users/me", `{"language_preference":"zh","household_size":3}`)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "zh")
	svc.AssertExpectations(t)
}

func TestHandler_UpdateProfile_BadJSON(t *testing.T) {
	svc := new(mockUserSvc)
	r := newRouter(svc)

	w := put(r, "/api/v1/users/me", `{bad}`)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	svc.AssertNotCalled(t, "UpdateProfile")
}
