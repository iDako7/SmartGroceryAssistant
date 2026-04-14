package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/events"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/handler"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/metrics"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/middleware"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/repository"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	_ = godotenv.Load("../../.env")

	dbURL := mustEnv("USER_DB_URL")
	jwtSecret := mustEnv("JWT_SECRET")
	amqpURL := getEnv("RABBITMQ_URL", "amqp://sga:sga_secret@localhost:5672/")
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

	// Periodically export pgxpool stats to Prometheus.
	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			stat := db.Stat()
			metrics.DBPoolTotalConns.Set(float64(stat.TotalConns()))
			metrics.DBPoolIdleConns.Set(float64(stat.IdleConns()))
			metrics.DBPoolAcquiredConns.Set(float64(stat.AcquiredConns()))
		}
	}()

	pub, err := events.NewPublisher(amqpURL)
	if err != nil {
		log.Printf("WARN: rabbitmq unavailable, saga events disabled: %v", err)
	}

	repo := repository.NewUserRepo(db)
	svc := service.NewUserService(repo, jwtSecret, pub)
	h := handler.New(svc)

	// Start the outbox poller — publishes events written by DeleteUserWithOutbox.
	if pub != nil {
		poller := events.NewOutboxPoller(
			func(ctx context.Context, limit int) ([]events.OutboxRow, error) {
				repoEvents, err := repo.FetchUnpublishedEvents(ctx, limit)
				if err != nil {
					return nil, err
				}
				out := make([]events.OutboxRow, len(repoEvents))
				for i, e := range repoEvents {
					out[i] = events.OutboxRow{ID: e.ID, EventType: e.EventType, Payload: e.Payload}
				}
				return out, nil
			},
			repo.MarkPublished,
			pub.Channel(),
			500*time.Millisecond,
		)
		go poller.Run(context.Background())
	}

	r := gin.Default()
	r.Use(middleware.Metrics())

	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Auth — no JWT required
	users := r.Group("/api/v1/users")
	{
		users.POST("/register", h.Register)
		users.POST("/login", h.Login)
	}

	// Profile — JWT required
	me := r.Group("/api/v1/users", middleware.Auth(jwtSecret))
	{
		me.GET("/me", h.GetProfile)
		me.PUT("/me", h.UpdateProfile)
		me.DELETE("/me", h.DeleteAccount)
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
