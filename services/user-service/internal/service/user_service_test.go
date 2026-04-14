package service_test

import (
	"context"
	"errors"
	"testing"

	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/model"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/service"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"golang.org/x/crypto/bcrypt"
)

// ── Mock repository ──────────────────────────────────────

type mockUserRepo struct{ mock.Mock }

func (m *mockUserRepo) CreateUser(ctx context.Context, email, hash string) (*model.User, error) {
	args := m.Called(ctx, email, hash)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *mockUserRepo) GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *mockUserRepo) GetUserByID(ctx context.Context, id string) (*model.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *mockUserRepo) CreateProfile(ctx context.Context, user model.User) (*model.Profile, error) {
	args := m.Called(ctx, user)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Profile), args.Error(1)
}

func (m *mockUserRepo) GetProfileByUserID(ctx context.Context, userID string) (*model.Profile, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Profile), args.Error(1)
}

func (m *mockUserRepo) UpdateProfile(ctx context.Context, userID string, req model.UpdateProfileRequest) (*model.Profile, error) {
	args := m.Called(ctx, userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Profile), args.Error(1)
}

func (m *mockUserRepo) DeleteUser(ctx context.Context, userID string) error {
	return m.Called(ctx, userID).Error(0)
}

func (m *mockUserRepo) DeleteUserWithOutbox(ctx context.Context, userID string) error {
	return m.Called(ctx, userID).Error(0)
}

// ── Helpers ──────────────────────────────────────────────

var testUUID = pgtype.UUID{
	Bytes: [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
	Valid: true,
}

func makeUser(email, password string) *model.User {
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)
	return &model.User{ID: testUUID, Email: email, PasswordHash: string(hash)}
}

func makeProfile() *model.Profile {
	return &model.Profile{
		ID:                  testUUID,
		LanguagePreference:  "en",
		DietaryRestrictions: []string{},
		HouseholdSize:       1,
	}
}

// ── Register ─────────────────────────────────────────────

func TestUserService_Register_Success(t *testing.T) {
	repo := new(mockUserRepo)
	svc := service.NewUserService(repo, "test-secret")

	user := makeUser("test@example.com", "password123")
	profile := makeProfile()

	repo.On("CreateUser", mock.Anything, "test@example.com", mock.AnythingOfType("string")).
		Return(user, nil)
	repo.On("CreateProfile", mock.Anything, *user).Return(profile, nil)

	resp, err := svc.Register(context.Background(), model.RegisterRequest{
		Email: "test@example.com", Password: "password123",
	})

	assert.NoError(t, err)
	assert.NotEmpty(t, resp.Token)
	assert.Equal(t, "test@example.com", resp.User.Email)
	repo.AssertExpectations(t)
}

func TestUserService_Register_EmailTaken(t *testing.T) {
	repo := new(mockUserRepo)
	svc := service.NewUserService(repo, "test-secret")

	pgErr := errors.New("ERROR: duplicate key value violates unique constraint (SQLSTATE 23505)")
	repo.On("CreateUser", mock.Anything, mock.Anything, mock.Anything).Return(nil, pgErr)

	_, err := svc.Register(context.Background(), model.RegisterRequest{
		Email: "taken@example.com", Password: "password123",
	})

	assert.ErrorIs(t, err, service.ErrEmailTaken)
	repo.AssertExpectations(t)
}

func TestUserService_Register_CreateProfileError(t *testing.T) {
	repo := new(mockUserRepo)
	svc := service.NewUserService(repo, "test-secret")

	user := makeUser("test@example.com", "password123")
	repo.On("CreateUser", mock.Anything, mock.Anything, mock.Anything).Return(user, nil)
	repo.On("CreateProfile", mock.Anything, *user).Return(nil, errors.New("db error"))

	_, err := svc.Register(context.Background(), model.RegisterRequest{
		Email: "test@example.com", Password: "password123",
	})

	assert.Error(t, err)
	repo.AssertExpectations(t)
}

// ── Login ────────────────────────────────────────────────

func TestUserService_Login_Success(t *testing.T) {
	repo := new(mockUserRepo)
	svc := service.NewUserService(repo, "test-secret")

	user := makeUser("test@example.com", "password123")
	profile := makeProfile()

	repo.On("GetUserByEmail", mock.Anything, "test@example.com").Return(user, nil)
	repo.On("GetProfileByUserID", mock.Anything, mock.AnythingOfType("string")).Return(profile, nil)

	resp, err := svc.Login(context.Background(), model.LoginRequest{
		Email: "test@example.com", Password: "password123",
	})

	assert.NoError(t, err)
	assert.NotEmpty(t, resp.Token)
	assert.Equal(t, "test@example.com", resp.User.Email)
	repo.AssertExpectations(t)
}

func TestUserService_Login_UserNotFound(t *testing.T) {
	repo := new(mockUserRepo)
	svc := service.NewUserService(repo, "test-secret")

	repo.On("GetUserByEmail", mock.Anything, mock.Anything).
		Return(nil, errors.New("no rows in result set"))

	_, err := svc.Login(context.Background(), model.LoginRequest{
		Email: "nobody@example.com", Password: "password123",
	})

	assert.Error(t, err)
	repo.AssertExpectations(t)
}

func TestUserService_Login_WrongPassword(t *testing.T) {
	repo := new(mockUserRepo)
	svc := service.NewUserService(repo, "test-secret")

	user := makeUser("test@example.com", "correct_password")
	repo.On("GetUserByEmail", mock.Anything, "test@example.com").Return(user, nil)

	_, err := svc.Login(context.Background(), model.LoginRequest{
		Email: "test@example.com", Password: "wrong_password",
	})

	assert.ErrorIs(t, err, service.ErrInvalidCreds)
	repo.AssertExpectations(t)
}

// ── GetProfile ───────────────────────────────────────────

func TestUserService_GetProfile_Success(t *testing.T) {
	repo := new(mockUserRepo)
	svc := service.NewUserService(repo, "test-secret")

	user := makeUser("test@example.com", "password123")
	profile := makeProfile()
	uid := "01020304-0506-0708-090a-0b0c0d0e0f10"

	repo.On("GetUserByID", mock.Anything, uid).Return(user, nil)
	repo.On("GetProfileByUserID", mock.Anything, uid).Return(profile, nil)

	view, err := svc.GetProfile(context.Background(), uid)

	assert.NoError(t, err)
	assert.Equal(t, uid, view.ID)
	assert.Equal(t, "test@example.com", view.Email)
	repo.AssertExpectations(t)
}

func TestUserService_GetProfile_UserNotFound(t *testing.T) {
	repo := new(mockUserRepo)
	svc := service.NewUserService(repo, "test-secret")

	repo.On("GetUserByID", mock.Anything, mock.Anything).Return(nil, errors.New("not found"))

	_, err := svc.GetProfile(context.Background(), "nonexistent-id")

	assert.Error(t, err)
	repo.AssertExpectations(t)
}

// ── UpdateProfile ────────────────────────────────────────

func TestUserService_UpdateProfile_Success(t *testing.T) {
	repo := new(mockUserRepo)
	svc := service.NewUserService(repo, "test-secret")

	profile := makeProfile()
	profile.LanguagePreference = "zh"
	uid := "01020304-0506-0708-090a-0b0c0d0e0f10"
	req := model.UpdateProfileRequest{LanguagePreference: "zh", HouseholdSize: 2}

	repo.On("UpdateProfile", mock.Anything, uid, req).Return(profile, nil)

	view, err := svc.UpdateProfile(context.Background(), uid, req)

	assert.NoError(t, err)
	assert.Equal(t, "zh", view.LanguagePreference)
	repo.AssertExpectations(t)
}
