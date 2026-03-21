package handler

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/model"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/service"
)

// Ensure *service.ListService satisfies listServicer at compile time.
var _ listServicer = (*service.ListService)(nil)

type listServicer interface {
	GetFullList(ctx context.Context, userID string) (*model.FullListResponse, error)
	GetSections(ctx context.Context, userID string) ([]model.SectionView, error)
	CreateSection(ctx context.Context, userID string, req model.CreateSectionRequest) (*model.SectionView, error)
	UpdateSection(ctx context.Context, id, userID string, req model.UpdateSectionRequest) (*model.SectionView, error)
	DeleteSection(ctx context.Context, id, userID string) error
	GetItems(ctx context.Context, userID, sectionID string) ([]model.ItemView, error)
	CreateItem(ctx context.Context, userID, sectionID string, req model.CreateItemRequest) (*model.ItemView, error)
	UpdateItem(ctx context.Context, userID, id string, req model.UpdateItemRequest) (*model.ItemView, error)
	DeleteItem(ctx context.Context, userID, id string) error
}

type Handler struct {
	svc listServicer
}

func New(svc listServicer) *Handler {
	return &Handler{svc: svc}
}

func userID(c *gin.Context) (string, bool) {
	v, ok := c.Get("userID")
	if !ok {
		return "", false
	}
	s, ok := v.(string)
	return s, ok
}

// ── Full list ────────────────────────────────────────────

func (h *Handler) GetFullList(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user identity"})
		return
	}
	resp, err := h.svc.GetFullList(c.Request.Context(), uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch list"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// ── Sections ─────────────────────────────────────────────

func (h *Handler) GetSections(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user identity"})
		return
	}
	sections, err := h.svc.GetSections(c.Request.Context(), uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch sections"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"sections": sections})
}

func (h *Handler) CreateSection(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user identity"})
		return
	}
	var req model.CreateSectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	section, err := h.svc.CreateSection(c.Request.Context(), uid, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create section"})
		return
	}
	c.JSON(http.StatusCreated, section)
}

func (h *Handler) UpdateSection(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user identity"})
		return
	}
	var req model.UpdateSectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	section, err := h.svc.UpdateSection(c.Request.Context(), c.Param("id"), uid, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update section"})
		return
	}
	c.JSON(http.StatusOK, section)
}

func (h *Handler) DeleteSection(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user identity"})
		return
	}
	if err := h.svc.DeleteSection(c.Request.Context(), c.Param("id"), uid); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete section"})
		return
	}
	c.Status(http.StatusNoContent)
}

// ── Items ────────────────────────────────────────────────

func (h *Handler) GetItems(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user identity"})
		return
	}
	items, err := h.svc.GetItems(c.Request.Context(), uid, c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch items"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *Handler) CreateItem(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user identity"})
		return
	}
	var req model.CreateItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	item, err := h.svc.CreateItem(c.Request.Context(), uid, c.Param("id"), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create item"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *Handler) UpdateItem(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user identity"})
		return
	}
	var req model.UpdateItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	item, err := h.svc.UpdateItem(c.Request.Context(), uid, c.Param("id"), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update item"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *Handler) DeleteItem(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user identity"})
		return
	}
	if err := h.svc.DeleteItem(c.Request.Context(), uid, c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete item"})
		return
	}
	c.Status(http.StatusNoContent)
}
