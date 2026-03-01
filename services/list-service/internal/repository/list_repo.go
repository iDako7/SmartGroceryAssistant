package repository

import (
	"context"
	"fmt"

	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ListRepo struct {
	db *pgxpool.Pool
}

func NewListRepo(db *pgxpool.Pool) *ListRepo {
	return &ListRepo{db: db}
}

// ── Sections ─────────────────────────────────────────────

func (r *ListRepo) GetSections(ctx context.Context, userID string) ([]model.Section, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, user_id, name, position, deleted_at, created_at, updated_at
		 FROM sections
		 WHERE user_id = $1 AND deleted_at IS NULL
		 ORDER BY position, created_at`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("get sections: %w", err)
	}
	defer rows.Close()

	var sections []model.Section
	for rows.Next() {
		var s model.Section
		if err := rows.Scan(&s.ID, &s.UserID, &s.Name, &s.Position, &s.DeletedAt, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		sections = append(sections, s)
	}
	return sections, rows.Err()
}

func (r *ListRepo) CreateSection(ctx context.Context, userID, name string, position int) (*model.Section, error) {
	var s model.Section
	err := r.db.QueryRow(ctx,
		`INSERT INTO sections (user_id, name, position)
		 VALUES ($1, $2, $3)
		 RETURNING id, user_id, name, position, deleted_at, created_at, updated_at`,
		userID, name, position,
	).Scan(&s.ID, &s.UserID, &s.Name, &s.Position, &s.DeletedAt, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create section: %w", err)
	}
	return &s, nil
}

func (r *ListRepo) UpdateSection(ctx context.Context, id, userID string, req model.UpdateSectionRequest) (*model.Section, error) {
	var s model.Section
	err := r.db.QueryRow(ctx,
		`UPDATE sections
		 SET name      = CASE WHEN $3 != '' THEN $3 ELSE name END,
		     position  = CASE WHEN $4 IS NOT NULL THEN $4 ELSE position END,
		     updated_at = NOW()
		 WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
		 RETURNING id, user_id, name, position, deleted_at, created_at, updated_at`,
		id, userID, req.Name, req.Position,
	).Scan(&s.ID, &s.UserID, &s.Name, &s.Position, &s.DeletedAt, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("update section: %w", err)
	}
	return &s, nil
}

func (r *ListRepo) DeleteSection(ctx context.Context, id, userID string) error {
	tag, err := r.db.Exec(ctx,
		`UPDATE sections SET deleted_at = NOW(), updated_at = NOW()
		 WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
		id, userID,
	)
	if err != nil {
		return fmt.Errorf("delete section: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("section not found")
	}
	return nil
}

// ── Items ────────────────────────────────────────────────

func (r *ListRepo) GetItems(ctx context.Context, sectionID string) ([]model.Item, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, section_id, name_en, name_secondary, quantity, checked, deleted_at, created_at, updated_at
		 FROM items
		 WHERE section_id = $1 AND deleted_at IS NULL
		 ORDER BY created_at`,
		sectionID,
	)
	if err != nil {
		return nil, fmt.Errorf("get items: %w", err)
	}
	defer rows.Close()

	var items []model.Item
	for rows.Next() {
		var i model.Item
		if err := rows.Scan(&i.ID, &i.SectionID, &i.NameEn, &i.NameSecondary, &i.Quantity, &i.Checked, &i.DeletedAt, &i.CreatedAt, &i.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

func (r *ListRepo) CreateItem(ctx context.Context, sectionID string, req model.CreateItemRequest) (*model.Item, error) {
	qty := 1
	if req.Quantity > 0 {
		qty = req.Quantity
	}
	var i model.Item
	err := r.db.QueryRow(ctx,
		`INSERT INTO items (section_id, name_en, name_secondary, quantity)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, section_id, name_en, name_secondary, quantity, checked, deleted_at, created_at, updated_at`,
		sectionID, req.NameEn, req.NameSecondary, qty,
	).Scan(&i.ID, &i.SectionID, &i.NameEn, &i.NameSecondary, &i.Quantity, &i.Checked, &i.DeletedAt, &i.CreatedAt, &i.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create item: %w", err)
	}
	return &i, nil
}

func (r *ListRepo) UpdateItem(ctx context.Context, id string, req model.UpdateItemRequest) (*model.Item, error) {
	var i model.Item
	err := r.db.QueryRow(ctx,
		`UPDATE items
		 SET name_en        = CASE WHEN $2 != '' THEN $2 ELSE name_en END,
		     name_secondary = COALESCE($3, name_secondary),
		     quantity       = COALESCE($4, quantity),
		     checked        = COALESCE($5, checked),
		     updated_at     = NOW()
		 WHERE id = $1 AND deleted_at IS NULL
		 RETURNING id, section_id, name_en, name_secondary, quantity, checked, deleted_at, created_at, updated_at`,
		id, req.NameEn, req.NameSecondary, req.Quantity, req.Checked,
	).Scan(&i.ID, &i.SectionID, &i.NameEn, &i.NameSecondary, &i.Quantity, &i.Checked, &i.DeletedAt, &i.CreatedAt, &i.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("update item: %w", err)
	}
	return &i, nil
}

func (r *ListRepo) DeleteItem(ctx context.Context, id string) error {
	tag, err := r.db.Exec(ctx,
		`UPDATE items SET deleted_at = NOW(), updated_at = NOW()
		 WHERE id = $1 AND deleted_at IS NULL`,
		id,
	)
	if err != nil {
		return fmt.Errorf("delete item: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("item not found")
	}
	return nil
}

// ── Full list ────────────────────────────────────────────

func (r *ListRepo) GetFullList(ctx context.Context, userID string) ([]model.Section, map[string][]model.Item, error) {
	sections, err := r.GetSections(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

	itemsBySection := make(map[string][]model.Item)
	for _, s := range sections {
		items, err := r.GetItems(ctx, s.ID)
		if err != nil {
			return nil, nil, err
		}
		itemsBySection[s.ID] = items
	}
	return sections, itemsBySection, nil
}
