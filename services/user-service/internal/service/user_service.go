package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrEmailTaken    = errors.New("email already registered")
	ErrInvalidCreds  = errors.New("invalid email or password")
)

// UserRepository is the data-access interface consumed by UserService.
type UserRepository interface {
	CreateUser(ctx context.Context, email, passwordHash string) (*model.User, error)
	GetUserByEmail(ctx context.Context, email string) (*model.User, error)
	GetUserByID(ctx context.Context, id string) (*model.User, error)
	CreateProfile(ctx context.Context, user model.User) (*model.Profile, error)
	GetProfileByUserID(ctx context.Context, userID string) (*model.Profile, error)
	UpdateProfile(ctx context.Context, userID string, req model.UpdateProfileRequest) (*model.Profile, error)
}

type UserService struct {
	repo      UserRepository
	jwtSecret string
	jwtTTL    time.Duration
}

func NewUserService(repo UserRepository, jwtSecret string) *UserService {
	return &UserService{
		repo:      repo,
		jwtSecret: jwtSecret,
		jwtTTL:    7 * 24 * time.Hour,
	}
}

func (s *UserService) Register(ctx context.Context, req model.RegisterRequest) (*model.AuthResponse, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user, err := s.repo.CreateUser(ctx, req.Email, string(hash))
	if err != nil {
		// Postgres unique violation code
		if isUniqueViolation(err) {
			return nil, ErrEmailTaken
		}
		return nil, err
	}

	profile, err := s.repo.CreateProfile(ctx, *user)
	if err != nil {
		return nil, err
	}

	token, err := s.issueToken(user)
	if err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		Token: token,
		User:  toProfileView(user, profile),
	}, nil
}

func (s *UserService) Login(ctx context.Context, req model.LoginRequest) (*model.AuthResponse, error) {
	user, err := s.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvalidCreds
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return nil, ErrInvalidCreds
		}
		return nil, fmt.Errorf("verify password: %w", err)
	}

	profile, err := s.repo.GetProfileByUserID(ctx, uuidString(user.ID))
	if err != nil {
		return nil, err
	}

	token, err := s.issueToken(user)
	if err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		Token: token,
		User:  toProfileView(user, profile),
	}, nil
}

func (s *UserService) GetProfile(ctx context.Context, userID string) (*model.ProfileView, error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	profile, err := s.repo.GetProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	view := toProfileView(user, profile)
	return &view, nil
}

func (s *UserService) UpdateProfile(ctx context.Context, userID string, req model.UpdateProfileRequest) (*model.ProfileView, error) {
	profile, err := s.repo.UpdateProfile(ctx, userID, req)
	if err != nil {
		return nil, err
	}

	view := model.ProfileView{
		ID:                  userID,
		LanguagePreference:  profile.LanguagePreference,
		DietaryRestrictions: profile.DietaryRestrictions,
		HouseholdSize:       profile.HouseholdSize,
		TastePreferences:    profile.TastePreferences,
	}
	return &view, nil
}

func (s *UserService) issueToken(user *model.User) (string, error) {
	claims := jwt.MapClaims{
		"sub": uuidString(user.ID),
		"exp": time.Now().Add(s.jwtTTL).Unix(),
		"iat": time.Now().Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(s.jwtSecret))
}

func toProfileView(user *model.User, profile *model.Profile) model.ProfileView {
	return model.ProfileView{
		ID:                  uuidString(user.ID),
		Email:               user.Email,
		LanguagePreference:  profile.LanguagePreference,
		DietaryRestrictions: profile.DietaryRestrictions,
		HouseholdSize:       profile.HouseholdSize,
		TastePreferences:    profile.TastePreferences,
	}
}

func uuidString(id pgtype.UUID) string {
	return fmt.Sprintf("%x-%x-%x-%x-%x",
		id.Bytes[0:4], id.Bytes[4:6],
		id.Bytes[6:8], id.Bytes[8:10],
		id.Bytes[10:16])
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
