package model

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

type User struct {
	ID           pgtype.UUID `db:"id"`
	Email        string      `db:"email"`
	PasswordHash string      `db:"password_hash"`
	CreatedAt    time.Time   `db:"created_at"`
	UpdatedAt    time.Time   `db:"updated_at"`
}

type Profile struct {
	ID                  pgtype.UUID `db:"id"`
	UserID              pgtype.UUID `db:"user_id"`
	LanguagePreference  string      `db:"language_preference"`
	DietaryRestrictions []string    `db:"dietary_restrictions"`
	HouseholdSize       int16       `db:"household_size"`
	TastePreferences    string      `db:"taste_preferences"`
	CreatedAt           time.Time   `db:"created_at"`
	UpdatedAt           time.Time   `db:"updated_at"`
}

// ── Request / Response DTOs ──────────────────────────────

type RegisterRequest struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  ProfileView `json:"user"`
}

type UpdateProfileRequest struct {
	LanguagePreference  string   `json:"language_preference"`
	DietaryRestrictions []string `json:"dietary_restrictions"`
	HouseholdSize       int16    `json:"household_size"`
	TastePreferences    string   `json:"taste_preferences"`
}

type ProfileView struct {
	ID                  string   `json:"id"`
	Email               string   `json:"email"`
	LanguagePreference  string   `json:"language_preference"`
	DietaryRestrictions []string `json:"dietary_restrictions"`
	HouseholdSize       int16    `json:"household_size"`
	TastePreferences    string   `json:"taste_preferences"`
}
