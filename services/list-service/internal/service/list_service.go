package service

import (
	"context"

	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/events"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/metrics"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/model"
)

// ListRepository is the data-access interface consumed by ListService.
type ListRepository interface {
	GetSections(ctx context.Context, userID string) ([]model.Section, error)
	CreateSection(ctx context.Context, userID, name string, position int) (*model.Section, error)
	UpdateSection(ctx context.Context, id, userID string, req model.UpdateSectionRequest) (*model.Section, error)
	DeleteSection(ctx context.Context, id, userID string) error
	GetItems(ctx context.Context, sectionID, userID string) ([]model.Item, error)
	CreateItem(ctx context.Context, sectionID, userID string, req model.CreateItemRequest) (*model.Item, error)
	UpdateItem(ctx context.Context, id, userID string, req model.UpdateItemRequest) (*model.Item, error)
	DeleteItem(ctx context.Context, id, userID string) error
	GetFullList(ctx context.Context, userID string) ([]model.Section, map[string][]model.Item, error)
	SoftDeleteAllByUser(ctx context.Context, userID string) (sections int64, items int64, err error)
}

// EventPublisher is the messaging interface consumed by ListService.
type EventPublisher interface {
	Publish(ctx context.Context, userID string, eventType events.EventType, payload any)
}

type ListService struct {
	repo ListRepository
	pub  EventPublisher
}

func NewListService(repo ListRepository, pub EventPublisher) *ListService {
	return &ListService{repo: repo, pub: pub}
}

// ── Sections ─────────────────────────────────────────────

func (s *ListService) GetSections(ctx context.Context, userID string) ([]model.SectionView, error) {
	sections, err := s.repo.GetSections(ctx, userID)
	if err != nil {
		return nil, err
	}
	views := make([]model.SectionView, len(sections))
	for i, sec := range sections {
		views[i] = toSectionView(sec)
	}
	return views, nil
}

func (s *ListService) CreateSection(ctx context.Context, userID string, req model.CreateSectionRequest) (*model.SectionView, error) {
	sec, err := s.repo.CreateSection(ctx, userID, req.Name, req.Position)
	if err != nil {
		return nil, err
	}
	s.pub.Publish(ctx, userID, events.SectionCreated, sec)
	v := toSectionView(*sec)
	return &v, nil
}

func (s *ListService) UpdateSection(ctx context.Context, id, userID string, req model.UpdateSectionRequest) (*model.SectionView, error) {
	sec, err := s.repo.UpdateSection(ctx, id, userID, req)
	if err != nil {
		return nil, err
	}
	s.pub.Publish(ctx, userID, events.SectionUpdated, sec)
	v := toSectionView(*sec)
	return &v, nil
}

func (s *ListService) DeleteSection(ctx context.Context, id, userID string) error {
	if err := s.repo.DeleteSection(ctx, id, userID); err != nil {
		return err
	}
	s.pub.Publish(ctx, userID, events.SectionDeleted, map[string]string{"id": id})
	return nil
}

// ── Items ────────────────────────────────────────────────

func (s *ListService) GetItems(ctx context.Context, userID, sectionID string) ([]model.ItemView, error) {
	items, err := s.repo.GetItems(ctx, sectionID, userID)
	if err != nil {
		return nil, err
	}
	views := make([]model.ItemView, len(items))
	for i, item := range items {
		views[i] = toItemView(item)
	}
	return views, nil
}

func (s *ListService) CreateItem(ctx context.Context, userID, sectionID string, req model.CreateItemRequest) (*model.ItemView, error) {
	item, err := s.repo.CreateItem(ctx, sectionID, userID, req)
	if err != nil {
		return nil, err
	}
	s.pub.Publish(ctx, userID, events.ItemCreated, item)
	v := toItemView(*item)
	return &v, nil
}

func (s *ListService) UpdateItem(ctx context.Context, userID, id string, req model.UpdateItemRequest) (*model.ItemView, error) {
	item, err := s.repo.UpdateItem(ctx, id, userID, req)
	if err != nil {
		return nil, err
	}
	s.pub.Publish(ctx, userID, events.ItemUpdated, item)
	v := toItemView(*item)
	return &v, nil
}

func (s *ListService) DeleteItem(ctx context.Context, userID, id string) error {
	if err := s.repo.DeleteItem(ctx, id, userID); err != nil {
		return err
	}
	s.pub.Publish(ctx, userID, events.ItemDeleted, map[string]string{"id": id})
	return nil
}

// ── User cleanup ────────────────────────────────────────

func (s *ListService) SoftDeleteAllByUser(ctx context.Context, userID string) error {
	sections, items, err := s.repo.SoftDeleteAllByUser(ctx, userID)
	if err != nil {
		return err
	}
	metrics.SagaCleanupSections.Add(float64(sections))
	metrics.SagaCleanupItems.Add(float64(items))
	if sections > 0 || items > 0 {
		s.pub.Publish(ctx, userID, events.SectionDeleted, map[string]any{
			"reason":   "user_deleted",
			"sections": sections,
			"items":    items,
		})
	}
	return nil
}

// ── Full list ────────────────────────────────────────────

func (s *ListService) GetFullList(ctx context.Context, userID string) (*model.FullListResponse, error) {
	sections, itemsBySection, err := s.repo.GetFullList(ctx, userID)
	if err != nil {
		return nil, err
	}

	views := make([]model.SectionView, len(sections))
	for i, sec := range sections {
		v := toSectionView(sec)
		items := itemsBySection[sec.ID]
		v.Items = make([]model.ItemView, len(items))
		for j, item := range items {
			v.Items[j] = toItemView(item)
		}
		views[i] = v
	}
	return &model.FullListResponse{Sections: views}, nil
}

// ── Helpers ──────────────────────────────────────────────

func toSectionView(s model.Section) model.SectionView {
	return model.SectionView{
		ID:        s.ID,
		Name:      s.Name,
		Position:  s.Position,
		CreatedAt: s.CreatedAt,
		UpdatedAt: s.UpdatedAt,
	}
}

func toItemView(i model.Item) model.ItemView {
	return model.ItemView{
		ID:            i.ID,
		SectionID:     i.SectionID,
		NameEn:        i.NameEn,
		NameSecondary: i.NameSecondary,
		Quantity:      i.Quantity,
		Checked:       i.Checked,
		CreatedAt:     i.CreatedAt,
		UpdatedAt:     i.UpdatedAt,
	}
}
