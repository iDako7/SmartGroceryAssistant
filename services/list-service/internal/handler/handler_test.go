package handler_test

import (
	"bytes"
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/handler"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func init() { gin.SetMode(gin.TestMode) }

// ── Mock service ─────────────────────────────────────────

type mockListSvc struct{ mock.Mock }

func (m *mockListSvc) GetFullList(ctx context.Context, userID string) (*model.FullListResponse, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.FullListResponse), args.Error(1)
}

func (m *mockListSvc) GetSections(ctx context.Context, userID string) ([]model.SectionView, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]model.SectionView), args.Error(1)
}

func (m *mockListSvc) CreateSection(ctx context.Context, userID string, req model.CreateSectionRequest) (*model.SectionView, error) {
	args := m.Called(ctx, userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.SectionView), args.Error(1)
}

func (m *mockListSvc) UpdateSection(ctx context.Context, id, userID string, req model.UpdateSectionRequest) (*model.SectionView, error) {
	args := m.Called(ctx, id, userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.SectionView), args.Error(1)
}

func (m *mockListSvc) DeleteSection(ctx context.Context, id, userID string) error {
	return m.Called(ctx, id, userID).Error(0)
}

func (m *mockListSvc) GetItems(ctx context.Context, userID, sectionID string) ([]model.ItemView, error) {
	args := m.Called(ctx, userID, sectionID)
	return args.Get(0).([]model.ItemView), args.Error(1)
}

func (m *mockListSvc) CreateItem(ctx context.Context, userID, sectionID string, req model.CreateItemRequest) (*model.ItemView, error) {
	args := m.Called(ctx, userID, sectionID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ItemView), args.Error(1)
}

func (m *mockListSvc) UpdateItem(ctx context.Context, userID, id string, req model.UpdateItemRequest) (*model.ItemView, error) {
	args := m.Called(ctx, userID, id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ItemView), args.Error(1)
}

func (m *mockListSvc) DeleteItem(ctx context.Context, userID, id string) error {
	return m.Called(ctx, userID, id).Error(0)
}

// ── Helpers ──────────────────────────────────────────────

var now = time.Now()

func newRouter(svc *mockListSvc) *gin.Engine {
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("userID", "user-1")
		c.Next()
	})
	h := handler.New(svc)
	v1 := r.Group("/api/v1/lists")
	{
		v1.GET("/full", h.GetFullList)
		v1.GET("/sections", h.GetSections)
		v1.POST("/sections", h.CreateSection)
		v1.PUT("/sections/:id", h.UpdateSection)
		v1.DELETE("/sections/:id", h.DeleteSection)
		v1.GET("/sections/:id/items", h.GetItems)
		v1.POST("/sections/:id/items", h.CreateItem)
		v1.PUT("/items/:id", h.UpdateItem)
		v1.DELETE("/items/:id", h.DeleteItem)
	}
	return r
}

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

func makeSectionView(id, name string) model.SectionView {
	return model.SectionView{ID: id, Name: name, Position: 0, CreatedAt: now, UpdatedAt: now}
}

func makeItemView(id, sectionID, name string) model.ItemView {
	return model.ItemView{ID: id, SectionID: sectionID, NameEn: name, Quantity: 1, CreatedAt: now, UpdatedAt: now}
}

// ── Full list ────────────────────────────────────────────

func TestHandler_GetFullList_Success(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	resp := &model.FullListResponse{Sections: []model.SectionView{makeSectionView("s1", "Produce")}}
	svc.On("GetFullList", mock.Anything, "user-1").Return(resp, nil)

	w := doRequest(r, http.MethodGet, "/api/v1/lists/full", "")

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "Produce")
	svc.AssertExpectations(t)
}

func TestHandler_GetFullList_Error(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	svc.On("GetFullList", mock.Anything, mock.Anything).Return(nil, errors.New("db error"))

	w := doRequest(r, http.MethodGet, "/api/v1/lists/full", "")

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ── Sections ─────────────────────────────────────────────

func TestHandler_GetSections_Success(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	sections := []model.SectionView{makeSectionView("s1", "Produce"), makeSectionView("s2", "Dairy")}
	svc.On("GetSections", mock.Anything, "user-1").Return(sections, nil)

	w := doRequest(r, http.MethodGet, "/api/v1/lists/sections", "")

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "Produce")
	svc.AssertExpectations(t)
}

func TestHandler_CreateSection_Success(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	sec := makeSectionView("s1", "Bakery")
	svc.On("CreateSection", mock.Anything, "user-1", model.CreateSectionRequest{Name: "Bakery", Position: 0}).
		Return(&sec, nil)

	w := doRequest(r, http.MethodPost, "/api/v1/lists/sections", `{"name":"Bakery"}`)

	assert.Equal(t, http.StatusCreated, w.Code)
	assert.Contains(t, w.Body.String(), "Bakery")
	svc.AssertExpectations(t)
}

func TestHandler_CreateSection_BadJSON(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	w := doRequest(r, http.MethodPost, "/api/v1/lists/sections", `{bad}`)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	svc.AssertNotCalled(t, "CreateSection")
}

func TestHandler_CreateSection_MissingName(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	w := doRequest(r, http.MethodPost, "/api/v1/lists/sections", `{}`)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestHandler_CreateSection_Error(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	svc.On("CreateSection", mock.Anything, mock.Anything, mock.Anything).Return(nil, errors.New("db error"))

	w := doRequest(r, http.MethodPost, "/api/v1/lists/sections", `{"name":"Bakery"}`)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestHandler_UpdateSection_Success(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	sec := makeSectionView("s1", "Frozen")
	svc.On("UpdateSection", mock.Anything, "s1", "user-1", mock.Anything).Return(&sec, nil)

	w := doRequest(r, http.MethodPut, "/api/v1/lists/sections/s1", `{"name":"Frozen"}`)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "Frozen")
}

func TestHandler_DeleteSection_Success(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	svc.On("DeleteSection", mock.Anything, "s1", "user-1").Return(nil)

	w := doRequest(r, http.MethodDelete, "/api/v1/lists/sections/s1", "")

	assert.Equal(t, http.StatusNoContent, w.Code)
	svc.AssertExpectations(t)
}

func TestHandler_DeleteSection_Error(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	svc.On("DeleteSection", mock.Anything, mock.Anything, mock.Anything).Return(errors.New("not found"))

	w := doRequest(r, http.MethodDelete, "/api/v1/lists/sections/s1", "")

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ── Items ────────────────────────────────────────────────

func TestHandler_GetItems_Success(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	items := []model.ItemView{makeItemView("i1", "s1", "Milk")}
	svc.On("GetItems", mock.Anything, "user-1", "s1").Return(items, nil)

	w := doRequest(r, http.MethodGet, "/api/v1/lists/sections/s1/items", "")

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "Milk")
}

func TestHandler_CreateItem_Success(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	item := makeItemView("i1", "s1", "Butter")
	svc.On("CreateItem", mock.Anything, "user-1", "s1", model.CreateItemRequest{NameEn: "Butter", Quantity: 2}).
		Return(&item, nil)

	w := doRequest(r, http.MethodPost, "/api/v1/lists/sections/s1/items", `{"name_en":"Butter","quantity":2}`)

	assert.Equal(t, http.StatusCreated, w.Code)
	assert.Contains(t, w.Body.String(), "Butter")
}

func TestHandler_CreateItem_BadJSON(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	w := doRequest(r, http.MethodPost, "/api/v1/lists/sections/s1/items", `{bad}`)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	svc.AssertNotCalled(t, "CreateItem")
}

func TestHandler_UpdateItem_Success(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	checked := true
	item := makeItemView("i1", "s1", "Milk")
	item.Checked = true
	svc.On("UpdateItem", mock.Anything, "user-1", "i1", model.UpdateItemRequest{Checked: &checked}).
		Return(&item, nil)

	w := doRequest(r, http.MethodPut, "/api/v1/lists/items/i1", `{"checked":true}`)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandler_DeleteItem_Success(t *testing.T) {
	svc := new(mockListSvc)
	r := newRouter(svc)

	svc.On("DeleteItem", mock.Anything, "user-1", "i1").Return(nil)

	w := doRequest(r, http.MethodDelete, "/api/v1/lists/items/i1", "")

	assert.Equal(t, http.StatusNoContent, w.Code)
	svc.AssertExpectations(t)
}
