package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/model"
	"github.com/jackc/pgx/v5"
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
	DeleteUser(ctx context.Context, userID string) error
}

// EventPublisher publishes user lifecycle events to RabbitMQ.
type EventPublisher interface {
	PublishUserDeleted(ctx context.Context, userID string) error
}

type UserService struct {
	repo      UserRepository
	pub       EventPublisher
	jwtSecret string
	jwtTTL    time.Duration
}

func NewUserService(repo UserRepository, jwtSecret string, opts ...func(*UserService)) *UserService {
	s := &UserService{
		repo:      repo,
		jwtSecret: jwtSecret,
		jwtTTL:    7 * 24 * time.Hour,
	}
	for _, o := range opts {
		o(s)
	}
	return s
}

// WithPublisher sets the event publisher (optional — degrades gracefully if nil).
func WithPublisher(pub EventPublisher) func(*UserService) {
	return func(s *UserService) { s.pub = pub }
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
		return nil, ErrInvalidCreds
	}

	userIDStr := fmt.Sprintf("%x-%x-%x-%x-%x",
		user.ID.Bytes[0:4], user.ID.Bytes[4:6],
		user.ID.Bytes[6:8], user.ID.Bytes[8:10],
		user.ID.Bytes[10:16])

	profile, err := s.repo.GetProfileByUserID(ctx, userIDStr)
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

func (s *UserService) DeleteUser(ctx context.Context, userID string) error {
	if err := s.repo.DeleteUser(ctx, userID); err != nil {
		return err
	}

	// Publish user.deleted event so downstream services can clean up.
	if s.pub != nil {
		if err := s.pub.PublishUserDeleted(ctx, userID); err != nil {
			// Log but don't fail — the user is already deleted.
			// The periodic cleanup job (option 4) will catch orphaned data.
			log.Printf("warning: failed to publish user.deleted for %s: %v", userID, err)
		}
	}
	return nil
}

func (s *UserService) issueToken(user *model.User) (string, error) {
	userIDStr := fmt.Sprintf("%x-%x-%x-%x-%x",
		user.ID.Bytes[0:4], user.ID.Bytes[4:6],
		user.ID.Bytes[6:8], user.ID.Bytes[8:10],
		user.ID.Bytes[10:16])

	claims := jwt.MapClaims{
		"sub": userIDStr,
		"exp": time.Now().Add(s.jwtTTL).Unix(),
		"iat": time.Now().Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(s.jwtSecret))
}

func toProfileView(user *model.User, profile *model.Profile) model.ProfileView {
	userIDStr := fmt.Sprintf("%x-%x-%x-%x-%x",
		user.ID.Bytes[0:4], user.ID.Bytes[4:6],
		user.ID.Bytes[6:8], user.ID.Bytes[8:10],
		user.ID.Bytes[10:16])

	return model.ProfileView{
		ID:                  userIDStr,
		Email:               user.Email,
		LanguagePreference:  profile.LanguagePreference,
		DietaryRestrictions: profile.DietaryRestrictions,
		HouseholdSize:       profile.HouseholdSize,
		TastePreferences:    profile.TastePreferences,
	}
}

func isUniqueViolation(err error) bool {
	return err != nil && strings.Contains(err.Error(), "23505") // Postgres unique_violation SQLSTATE
}
