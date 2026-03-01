package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/model"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/service"
)

type Handler struct {
	svc *service.ListService
}

func New(svc *service.ListService) *Handler {
	return &Handler{svc: svc}
}

func userID(c *gin.Context) string {
	v, _ := c.Get("userID")
	return v.(string)
}

// ── Full list ────────────────────────────────────────────

func (h *Handler) GetFullList(c *gin.Context) {
	resp, err := h.svc.GetFullList(c.Request.Context(), userID(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch list"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// ── Sections ─────────────────────────────────────────────

func (h *Handler) GetSections(c *gin.Context) {
	sections, err := h.svc.GetSections(c.Request.Context(), userID(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch sections"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"sections": sections})
}

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

func (h *Handler) UpdateSection(c *gin.Context) {
	var req model.UpdateSectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	section, err := h.svc.UpdateSection(c.Request.Context(), c.Param("id"), userID(c), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update section"})
		return
	}
	c.JSON(http.StatusOK, section)
}

func (h *Handler) DeleteSection(c *gin.Context) {
	if err := h.svc.DeleteSection(c.Request.Context(), c.Param("id"), userID(c)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete section"})
		return
	}
	c.Status(http.StatusNoContent)
}

// ── Items ────────────────────────────────────────────────

func (h *Handler) GetItems(c *gin.Context) {
	items, err := h.svc.GetItems(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch items"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *Handler) CreateItem(c *gin.Context) {
	var req model.CreateItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item, err := h.svc.CreateItem(c.Request.Context(), userID(c), c.Param("id"), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create item"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *Handler) UpdateItem(c *gin.Context) {
	var req model.UpdateItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item, err := h.svc.UpdateItem(c.Request.Context(), userID(c), c.Param("id"), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update item"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *Handler) DeleteItem(c *gin.Context) {
	if err := h.svc.DeleteItem(c.Request.Context(), userID(c), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete item"})
		return
	}
	c.Status(http.StatusNoContent)
}
