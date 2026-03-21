package model

import "time"

// ── DB models ────────────────────────────────────────────

type Section struct {
	ID        string     `db:"id"`
	UserID    string     `db:"user_id"`
	Name      string     `db:"name"`
	Position  int        `db:"position"`
	DeletedAt *time.Time `db:"deleted_at"`
	CreatedAt time.Time  `db:"created_at"`
	UpdatedAt time.Time  `db:"updated_at"`
}

type Item struct {
	ID            string     `db:"id"`
	SectionID     string     `db:"section_id"`
	NameEn        string     `db:"name_en"`
	NameSecondary *string    `db:"name_secondary"`
	Quantity      int        `db:"quantity"`
	Checked       bool       `db:"checked"`
	DeletedAt     *time.Time `db:"deleted_at"`
	CreatedAt     time.Time  `db:"created_at"`
	UpdatedAt     time.Time  `db:"updated_at"`
}

// ── Request DTOs ─────────────────────────────────────────

type CreateSectionRequest struct {
	Name     string `json:"name"     binding:"required"`
	Position int    `json:"position"`
}

type UpdateSectionRequest struct {
	Name     string `json:"name"`
	Position *int   `json:"position"`
}

type CreateItemRequest struct {
	NameEn        string  `json:"name_en"        binding:"required"`
	NameSecondary *string `json:"name_secondary"`
	Quantity      int     `json:"quantity"`
}

type UpdateItemRequest struct {
	NameEn        string  `json:"name_en"`
	NameSecondary *string `json:"name_secondary"`
	Quantity      *int    `json:"quantity"`
	Checked       *bool   `json:"checked"`
}

// ── Response DTOs ────────────────────────────────────────

type SectionView struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Position  int        `json:"position"`
	Items     []ItemView `json:"items,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type ItemView struct {
	ID            string    `json:"id"`
	SectionID     string    `json:"section_id"`
	NameEn        string    `json:"name_en"`
	NameSecondary *string   `json:"name_secondary"`
	Quantity      int       `json:"quantity"`
	Checked       bool      `json:"checked"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type FullListResponse struct {
	Sections []SectionView `json:"sections"`
}
