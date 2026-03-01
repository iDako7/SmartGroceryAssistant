package main

import (
	"context"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/handler"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/middleware"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/repository"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load("../../.env")

	dbURL := mustEnv("USER_DB_URL")
	jwtSecret := mustEnv("JWT_SECRET")
	port := getEnv("USER_SERVICE_PORT", "4001")

	db, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("connect to user_db: %v", err)
	}
	defer db.Close()

	if err := db.Ping(context.Background()); err != nil {
		log.Fatalf("ping user_db: %v", err)
	}
	log.Println("connected to user_db")

	repo := repository.NewUserRepo(db)
	svc := service.NewUserService(repo, jwtSecret)
	h := handler.New(svc)

	r := gin.Default()

	// Auth — no JWT required
	auth := r.Group("/api/v1/auth")
	{
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
	}

	// Users — JWT required
	users := r.Group("/api/v1/users", middleware.Auth(jwtSecret))
	{
		users.GET("/profile", h.GetProfile)
		users.PUT("/profile", h.UpdateProfile)
	}

	log.Printf("user-service listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("run server: %v", err)
	}
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("missing required env var: %s", key)
	}
	return v
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
