package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/metrics"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepo struct {
	db *pgxpool.Pool
}

func NewUserRepo(db *pgxpool.Pool) *UserRepo {
	return &UserRepo{db: db}
}

// observeQuery records query duration and, on error, increments the error counter.
func observeQuery(operation string, start time.Time, err error) {
	metrics.DBQueryDuration.WithLabelValues(operation).Observe(time.Since(start).Seconds())
	if err != nil {
		metrics.DBQueryErrors.WithLabelValues(operation).Inc()
	}
}

func (r *UserRepo) CreateUser(ctx context.Context, email, passwordHash string) (_ *model.User, err error) {
	start := time.Now()
	defer func() { observeQuery("create_user", start, err) }()

	var u model.User
	err = r.db.QueryRow(ctx,
		`INSERT INTO users (email, password_hash)
		 VALUES ($1, $2)
		 RETURNING id, email, password_hash, created_at, updated_at`,
		email, passwordHash,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return &u, nil
}

func (r *UserRepo) GetUserByID(ctx context.Context, id string) (_ *model.User, err error) {
	start := time.Now()
	defer func() { observeQuery("get_user_by_id", start, err) }()

	var u model.User
	err = r.db.QueryRow(ctx,
		`SELECT id, email, password_hash, created_at, updated_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return &u, nil
}

func (r *UserRepo) GetUserByEmail(ctx context.Context, email string) (_ *model.User, err error) {
	start := time.Now()
	defer func() { observeQuery("get_user_by_email", start, err) }()

	var u model.User
	err = r.db.QueryRow(ctx,
		`SELECT id, email, password_hash, created_at, updated_at
		 FROM users WHERE email = $1`,
		email,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return &u, nil
}

func (r *UserRepo) CreateProfile(ctx context.Context, userID model.User) (_ *model.Profile, err error) {
	start := time.Now()
	defer func() { observeQuery("create_profile", start, err) }()

	var p model.Profile
	err = r.db.QueryRow(ctx,
		`INSERT INTO profiles (user_id)
		 VALUES ($1)
		 RETURNING id, user_id, language_preference, dietary_restrictions, household_size, taste_preferences, created_at, updated_at`,
		userID.ID,
	).Scan(&p.ID, &p.UserID, &p.LanguagePreference, &p.DietaryRestrictions, &p.HouseholdSize, &p.TastePreferences, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create profile: %w", err)
	}
	return &p, nil
}

func (r *UserRepo) GetProfileByUserID(ctx context.Context, userID string) (_ *model.Profile, err error) {
	start := time.Now()
	defer func() { observeQuery("get_profile_by_user_id", start, err) }()

	var p model.Profile
	err = r.db.QueryRow(ctx,
		`SELECT id, user_id, language_preference, dietary_restrictions, household_size, taste_preferences, created_at, updated_at
		 FROM profiles WHERE user_id = $1`,
		userID,
	).Scan(&p.ID, &p.UserID, &p.LanguagePreference, &p.DietaryRestrictions, &p.HouseholdSize, &p.TastePreferences, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get profile: %w", err)
	}
	return &p, nil
}

func (r *UserRepo) DeleteUser(ctx context.Context, userID string) (err error) {
	start := time.Now()
	defer func() { observeQuery("delete_user", start, err) }()

	// Profiles cascade-delete via FK, so just delete the user.
	tag, err := r.db.Exec(ctx, `DELETE FROM users WHERE id = $1`, userID)
	if err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}
	return nil
}

func (r *UserRepo) UpdateProfile(ctx context.Context, userID string, req model.UpdateProfileRequest) (_ *model.Profile, err error) {
	start := time.Now()
	defer func() { observeQuery("update_profile", start, err) }()

	var p model.Profile
	err = r.db.QueryRow(ctx,
		`UPDATE profiles
		 SET language_preference  = COALESCE(NULLIF($2, ''), language_preference),
		     dietary_restrictions = CASE WHEN $3::text[] IS NOT NULL THEN $3 ELSE dietary_restrictions END,
		     household_size       = CASE WHEN $4 > 0 THEN $4 ELSE household_size END,
		     taste_preferences    = COALESCE(NULLIF($5, ''), taste_preferences),
		     updated_at           = NOW()
		 WHERE user_id = $1
		 RETURNING id, user_id, language_preference, dietary_restrictions, household_size, taste_preferences, created_at, updated_at`,
		userID, req.LanguagePreference, req.DietaryRestrictions, req.HouseholdSize, req.TastePreferences,
	).Scan(&p.ID, &p.UserID, &p.LanguagePreference, &p.DietaryRestrictions, &p.HouseholdSize, &p.TastePreferences, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("update profile: %w", err)
	}
	return &p, nil
}
