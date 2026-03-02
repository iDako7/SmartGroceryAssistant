package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/events"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/model"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ── Mock repository ──────────────────────────────────────

type mockListRepo struct{ mock.Mock }

func (m *mockListRepo) GetSections(ctx context.Context, userID string) ([]model.Section, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]model.Section), args.Error(1)
}

func (m *mockListRepo) CreateSection(ctx context.Context, userID, name string, position int) (*model.Section, error) {
	args := m.Called(ctx, userID, name, position)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Section), args.Error(1)
}

func (m *mockListRepo) UpdateSection(ctx context.Context, id, userID string, req model.UpdateSectionRequest) (*model.Section, error) {
	args := m.Called(ctx, id, userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Section), args.Error(1)
}

func (m *mockListRepo) DeleteSection(ctx context.Context, id, userID string) error {
	return m.Called(ctx, id, userID).Error(0)
}

func (m *mockListRepo) GetItems(ctx context.Context, sectionID string) ([]model.Item, error) {
	args := m.Called(ctx, sectionID)
	return args.Get(0).([]model.Item), args.Error(1)
}

func (m *mockListRepo) CreateItem(ctx context.Context, sectionID string, req model.CreateItemRequest) (*model.Item, error) {
	args := m.Called(ctx, sectionID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Item), args.Error(1)
}

func (m *mockListRepo) UpdateItem(ctx context.Context, id string, req model.UpdateItemRequest) (*model.Item, error) {
	args := m.Called(ctx, id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Item), args.Error(1)
}

func (m *mockListRepo) DeleteItem(ctx context.Context, id string) error {
	return m.Called(ctx, id).Error(0)
}

func (m *mockListRepo) GetFullList(ctx context.Context, userID string) ([]model.Section, map[string][]model.Item, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]model.Section), args.Get(1).(map[string][]model.Item), args.Error(2)
}

// ── Mock publisher ───────────────────────────────────────

type mockPublisher struct{ mock.Mock }

func (m *mockPublisher) Publish(ctx context.Context, userID string, eventType events.EventType, payload any) {
	m.Called(ctx, userID, eventType, payload)
}

// ── Helpers ──────────────────────────────────────────────

var now = time.Now()

func makeSection(id, name string) model.Section {
	return model.Section{ID: id, UserID: "user-1", Name: name, Position: 0, CreatedAt: now, UpdatedAt: now}
}

func makeItem(id, sectionID, name string) model.Item {
	return model.Item{ID: id, SectionID: sectionID, NameEn: name, Quantity: 1, Checked: false, CreatedAt: now, UpdatedAt: now}
}

// ── Sections ─────────────────────────────────────────────

func TestListService_GetSections_Success(t *testing.T) {
	repo := new(mockListRepo)
	pub := new(mockPublisher)
	svc := service.NewListService(repo, pub)

	sections := []model.Section{makeSection("s1", "Produce"), makeSection("s2", "Dairy")}
	repo.On("GetSections", mock.Anything, "user-1").Return(sections, nil)

	views, err := svc.GetSections(context.Background(), "user-1")

	assert.NoError(t, err)
	assert.Len(t, views, 2)
	assert.Equal(t, "Produce", views[0].Name)
	repo.AssertExpectations(t)
}

func TestListService_GetSections_Empty(t *testing.T) {
	repo := new(mockListRepo)
	pub := new(mockPublisher)
	svc := service.NewListService(repo, pub)

	repo.On("GetSections", mock.Anything, "user-1").Return([]model.Section{}, nil)

	views, err := svc.GetSections(context.Background(), "user-1")

	assert.NoError(t, err)
	assert.Empty(t, views)
}

func TestListService_GetSections_Error(t *testing.T) {
	repo := new(mockListRepo)
	pub := new(mockPublisher)
	svc := service.NewListService(repo, pub)

	repo.On("GetSections", mock.Anything, mock.Anything).Return([]model.Section{}, errors.New("db error"))

	_, err := svc.GetSections(context.Background(), "user-1")

	assert.Error(t, err)
}

func TestListService_CreateSection_PublishesEvent(t *testing.T) {
	repo := new(mockListRepo)
	pub := new(mockPublisher)
	svc := service.NewListService(repo, pub)

	sec := makeSection("s1", "Produce")
	repo.On("CreateSection", mock.Anything, "user-1", "Produce", 0).Return(&sec, nil)
	pub.On("Publish", mock.Anything, "user-1", events.SectionCreated, mock.Anything).Return()

	view, err := svc.CreateSection(context.Background(), "user-1", model.CreateSectionRequest{Name: "Produce"})

	assert.NoError(t, err)
	assert.Equal(t, "Produce", view.Name)
	pub.AssertCalled(t, "Publish", mock.Anything, "user-1", events.SectionCreated, mock.Anything)
	repo.AssertExpectations(t)
}

func TestListService_CreateSection_RepoError(t *testing.T) {
	repo := new(mockListRepo)
	pub := new(mockPublisher)
	svc := service.NewListService(repo, pub)

	repo.On("CreateSection", mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(nil, errors.New("db error"))

	_, err := svc.CreateSection(context.Background(), "user-1", model.CreateSectionRequest{Name: "Produce"})

	assert.Error(t, err)
	pub.AssertNotCalled(t, "Publish")
}

func TestListService_UpdateSection_PublishesEvent(t *testing.T) {
	repo := new(mockListRepo)
	pub := new(mockPublisher)
	svc := service.NewListService(repo, pub)

	sec := makeSection("s1", "Frozen")
	req := model.UpdateSectionRequest{Name: "Frozen"}
	repo.On("UpdateSection", mock.Anything, "s1", "user-1", req).Return(&sec, nil)
	pub.On("Publish", mock.Anything, "user-1", events.SectionUpdated, mock.Anything).Return()

	view, err := svc.UpdateSection(context.Background(), "s1", "user-1", req)

	assert.NoError(t, err)
	assert.Equal(t, "Frozen", view.Name)
	pub.AssertCalled(t, "Publish", mock.Anything, "user-1", events.SectionUpdated, mock.Anything)
}

func TestListService_DeleteSection_PublishesEvent(t *testing.T) {
	repo := new(mockListRepo)
	pub := new(mockPublisher)
	svc := service.NewListService(repo, pub)

	repo.On("DeleteSection", mock.Anything, "s1", "user-1").Return(nil)
	pub.On("Publish", mock.Anything, "user-1", events.SectionDeleted, mock.Anything).Return()

	err := svc.DeleteSection(context.Background(), "s1", "user-1")

	assert.NoError(t, err)
	pub.AssertCalled(t, "Publish", mock.Anything, "user-1", events.SectionDeleted, mock.Anything)
}

// ── Items ────────────────────────────────────────────────

func TestListService_GetItems_Success(t *testing.T) {
	repo := new(mockListRepo)
	pub := new(mockPublisher)
	svc := service.NewListService(repo, pub)

	items := []model.Item{makeItem("i1", "s1", "Milk"), makeItem("i2", "s1", "Eggs")}
	repo.On("GetItems", mock.Anything, "s1").Return(items, nil)

	views, err := svc.GetItems(context.Background(), "s1")

	assert.NoError(t, err)
	assert.Len(t, views, 2)
	assert.Equal(t, "Milk", views[0].NameEn)
}

func TestListService_CreateItem_PublishesEvent(t *testing.T) {
	repo := new(mockListRepo)
	pub := new(mockPublisher)
	svc := service.NewListService(repo, pub)

	item := makeItem("i1", "s1", "Butter")
	req := model.CreateItemRequest{NameEn: "Butter", Quantity: 2}
	repo.On("CreateItem", mock.Anything, "s1", req).Return(&item, nil)
	pub.On("Publish", mock.Anything, "user-1", events.ItemCreated, mock.Anything).Return()

	view, err := svc.CreateItem(context.Background(), "user-1", "s1", req)

	assert.NoError(t, err)
	assert.Equal(t, "Butter", view.NameEn)
	pub.AssertCalled(t, "Publish", mock.Anything, "user-1", events.ItemCreated, mock.Anything)
}

func TestListService_UpdateItem_PublishesEvent(t *testing.T) {
	repo := new(mockListRepo)
	pub := new(mockPublisher)
	svc := service.NewListService(repo, pub)

	checked := true
	item := makeItem("i1", "s1", "Milk")
	item.Checked = true
	req := model.UpdateItemRequest{Checked: &checked}
	repo.On("UpdateItem", mock.Anything, "i1", req).Return(&item, nil)
	pub.On("Publish", mock.Anything, "user-1", events.ItemUpdated, mock.Anything).Return()

	view, err := svc.UpdateItem(context.Background(), "user-1", "i1", req)

	assert.NoError(t, err)
	assert.True(t, view.Checked)
}

func TestListService_DeleteItem_PublishesEvent(t *testing.T) {
	repo := new(mockListRepo)
	pub := new(mockPublisher)
	svc := service.NewListService(repo, pub)

	repo.On("DeleteItem", mock.Anything, "i1").Return(nil)
	pub.On("Publish", mock.Anything, "user-1", events.ItemDeleted, mock.Anything).Return()

	err := svc.DeleteItem(context.Background(), "user-1", "i1")

	assert.NoError(t, err)
	pub.AssertCalled(t, "Publish", mock.Anything, "user-1", events.ItemDeleted, mock.Anything)
}

// ── GetFullList ──────────────────────────────────────────

func TestListService_GetFullList_Success(t *testing.T) {
	repo := new(mockListRepo)
	pub := new(mockPublisher)
	svc := service.NewListService(repo, pub)

	sections := []model.Section{makeSection("s1", "Produce")}
	items := map[string][]model.Item{"s1": {makeItem("i1", "s1", "Apples")}}
	repo.On("GetFullList", mock.Anything, "user-1").Return(sections, items, nil)

	resp, err := svc.GetFullList(context.Background(), "user-1")

	assert.NoError(t, err)
	assert.Len(t, resp.Sections, 1)
	assert.Len(t, resp.Sections[0].Items, 1)
	assert.Equal(t, "Apples", resp.Sections[0].Items[0].NameEn)
}

func TestListService_GetFullList_Error(t *testing.T) {
	repo := new(mockListRepo)
	pub := new(mockPublisher)
	svc := service.NewListService(repo, pub)

	repo.On("GetFullList", mock.Anything, mock.Anything).
		Return([]model.Section{}, map[string][]model.Item{}, errors.New("db error"))

	_, err := svc.GetFullList(context.Background(), "user-1")

	assert.Error(t, err)
}
