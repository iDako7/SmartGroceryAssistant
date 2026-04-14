package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/metrics"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

// observeQuery records query duration and, on error, increments the error counter.
func observeQuery(operation string, start time.Time, err error) {
	metrics.DBQueryDuration.WithLabelValues(operation).Observe(time.Since(start).Seconds())
	if err != nil {
		metrics.DBQueryErrors.WithLabelValues(operation).Inc()
	}
}

type ListRepo struct {
	db *pgxpool.Pool
}

func NewListRepo(db *pgxpool.Pool) *ListRepo {
	return &ListRepo{db: db}
}

// ── Sections ─────────────────────────────────────────────

func (r *ListRepo) GetSections(ctx context.Context, userID string) (_ []model.Section, err error) {
	start := time.Now()
	defer func() { observeQuery("get_sections", start, err) }()

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

func (r *ListRepo) CreateSection(ctx context.Context, userID, name string, position int) (_ *model.Section, err error) {
	start := time.Now()
	defer func() { observeQuery("create_section", start, err) }()

	var s model.Section
	err = r.db.QueryRow(ctx,
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

func (r *ListRepo) UpdateSection(ctx context.Context, id, userID string, req model.UpdateSectionRequest) (_ *model.Section, err error) {
	start := time.Now()
	defer func() { observeQuery("update_section", start, err) }()

	var s model.Section
	err = r.db.QueryRow(ctx,
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

func (r *ListRepo) DeleteSection(ctx context.Context, id, userID string) (err error) {
	start := time.Now()
	defer func() { observeQuery("delete_section", start, err) }()

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

func (r *ListRepo) GetItems(ctx context.Context, sectionID, userID string) (_ []model.Item, err error) {
	start := time.Now()
	defer func() { observeQuery("get_items", start, err) }()

	rows, err := r.db.Query(ctx,
		`SELECT i.id, i.section_id, i.name_en, i.name_secondary, i.quantity, i.checked, i.deleted_at, i.created_at, i.updated_at
		 FROM items i
		 JOIN sections s ON s.id = i.section_id
		 WHERE i.section_id = $1 AND s.user_id = $2 AND i.deleted_at IS NULL
		 ORDER BY i.created_at`,
		sectionID, userID,
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

func (r *ListRepo) CreateItem(ctx context.Context, sectionID, userID string, req model.CreateItemRequest) (_ *model.Item, err error) {
	start := time.Now()
	defer func() { observeQuery("create_item", start, err) }()

	qty := 1
	if req.Quantity > 0 {
		qty = req.Quantity
	}
	var i model.Item
	err = r.db.QueryRow(ctx,
		`INSERT INTO items (section_id, name_en, name_secondary, quantity)
		 SELECT $1, $2, $3, $4
		 WHERE EXISTS (SELECT 1 FROM sections WHERE id = $1 AND user_id = $5 AND deleted_at IS NULL)
		 RETURNING id, section_id, name_en, name_secondary, quantity, checked, deleted_at, created_at, updated_at`,
		sectionID, req.NameEn, req.NameSecondary, qty, userID,
	).Scan(&i.ID, &i.SectionID, &i.NameEn, &i.NameSecondary, &i.Quantity, &i.Checked, &i.DeletedAt, &i.CreatedAt, &i.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create item: %w", err)
	}
	return &i, nil
}

func (r *ListRepo) UpdateItem(ctx context.Context, id, userID string, req model.UpdateItemRequest) (_ *model.Item, err error) {
	start := time.Now()
	defer func() { observeQuery("update_item", start, err) }()

	var i model.Item
	err = r.db.QueryRow(ctx,
		`UPDATE items
		 SET name_en        = CASE WHEN $2 != '' THEN $2 ELSE name_en END,
		     name_secondary = COALESCE($3, name_secondary),
		     quantity       = COALESCE($4, quantity),
		     checked        = COALESCE($5, checked),
		     updated_at     = NOW()
		 FROM sections s
		 WHERE items.id = $1 AND items.section_id = s.id AND s.user_id = $6 AND items.deleted_at IS NULL
		 RETURNING items.id, items.section_id, items.name_en, items.name_secondary, items.quantity, items.checked, items.deleted_at, items.created_at, items.updated_at`,
		id, req.NameEn, req.NameSecondary, req.Quantity, req.Checked, userID,
	).Scan(&i.ID, &i.SectionID, &i.NameEn, &i.NameSecondary, &i.Quantity, &i.Checked, &i.DeletedAt, &i.CreatedAt, &i.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("update item: %w", err)
	}
	return &i, nil
}

func (r *ListRepo) DeleteItem(ctx context.Context, id, userID string) (err error) {
	start := time.Now()
	defer func() { observeQuery("delete_item", start, err) }()

	tag, err := r.db.Exec(ctx,
		`UPDATE items SET deleted_at = NOW(), updated_at = NOW()
		 FROM sections s
		 WHERE items.id = $1 AND items.section_id = s.id AND s.user_id = $2 AND items.deleted_at IS NULL`,
		id, userID,
	)
	if err != nil {
		return fmt.Errorf("delete item: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("item not found")
	}
	return nil
}

// ── Saga: bulk soft-delete ───────────────────────────────

// SoftDeleteAllByUser soft-deletes every section and item belonging to a user.
// Returns the count of sections and items affected.
func (r *ListRepo) SoftDeleteAllByUser(ctx context.Context, userID string) (sections int64, items int64, err error) {
	start := time.Now()
	defer func() { observeQuery("soft_delete_all_by_user", start, err) }()

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, 0, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Soft-delete items belonging to this user's sections
	itemTag, err := tx.Exec(ctx,
		`UPDATE items SET deleted_at = NOW(), updated_at = NOW()
		 FROM sections s
		 WHERE items.section_id = s.id AND s.user_id = $1 AND items.deleted_at IS NULL`,
		userID,
	)
	if err != nil {
		return 0, 0, fmt.Errorf("soft delete items: %w", err)
	}

	// Soft-delete all sections belonging to this user
	secTag, err := tx.Exec(ctx,
		`UPDATE sections SET deleted_at = NOW(), updated_at = NOW()
		 WHERE user_id = $1 AND deleted_at IS NULL`,
		userID,
	)
	if err != nil {
		return 0, 0, fmt.Errorf("soft delete sections: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, 0, fmt.Errorf("commit tx: %w", err)
	}

	return secTag.RowsAffected(), itemTag.RowsAffected(), nil
}

// ── Full list ────────────────────────────────────────────

func (r *ListRepo) GetFullList(ctx context.Context, userID string) ([]model.Section, map[string][]model.Item, error) {
	sections, err := r.GetSections(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

	itemsBySection := make(map[string][]model.Item)
	for _, s := range sections {
		items, err := r.GetItems(ctx, s.ID, userID)
		if err != nil {
			return nil, nil, err
		}
		itemsBySection[s.ID] = items
	}
	return sections, itemsBySection, nil
}
