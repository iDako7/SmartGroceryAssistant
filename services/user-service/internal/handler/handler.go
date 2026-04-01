package handler

import (
	"context"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/model"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/service"
)

// Ensure *service.UserService satisfies userServicer at compile time.
var _ userServicer = (*service.UserService)(nil)

type userServicer interface {
	Register(ctx context.Context, req model.RegisterRequest) (*model.AuthResponse, error)
	Login(ctx context.Context, req model.LoginRequest) (*model.AuthResponse, error)
	GetProfile(ctx context.Context, userID string) (*model.ProfileView, error)
	UpdateProfile(ctx context.Context, userID string, req model.UpdateProfileRequest) (*model.ProfileView, error)
	DeleteUser(ctx context.Context, userID string) error
}

type Handler struct {
	svc userServicer
}

func New(svc userServicer) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.svc.Register(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrEmailTaken) {
			c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "registration failed"})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func (h *Handler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.svc.Login(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCreds) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "login failed"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) GetProfile(c *gin.Context) {
	userID, _ := c.Get("userID")

	profile, err := h.svc.GetProfile(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch profile"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (h *Handler) DeleteUser(c *gin.Context) {
	userID, _ := c.Get("userID")

	if err := h.svc.DeleteUser(c.Request.Context(), userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete user"})
		return
	}

	c.Status(http.StatusNoContent)
}

// UserExists is an internal endpoint for service-to-service calls.
// Returns 200 if user exists, 404 if not.
// Protected by the InternalAuth middleware (requires X-Internal-API-Key header).
func (h *Handler) UserExists(c *gin.Context) {
	userID := c.Param("id")
	_, err := h.svc.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}
	c.Status(http.StatusOK)
}

func (h *Handler) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req model.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile, err := h.svc.UpdateProfile(c.Request.Context(), userID.(string), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update profile"})
		return
	}

	c.JSON(http.StatusOK, profile)
}
