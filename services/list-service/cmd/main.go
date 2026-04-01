package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/cleanup"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/events"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/handler"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/metrics"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/middleware"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/repository"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	_ = godotenv.Load("../../.env")

	dbURL := mustEnv("LIST_DB_URL")
	jwtSecret := mustEnv("JWT_SECRET")
	amqpURL := getEnv("RABBITMQ_URL", "amqp://sga:sga_secret@localhost:5672/")
	userServiceURL := getEnv("USER_SERVICE_URL", "http://localhost:4001")
	internalAPIKey := getEnv("INTERNAL_API_KEY", "change_me_in_production")
	port := getEnv("LIST_SERVICE_PORT", "4002")

	db, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("connect to list_db: %v", err)
	}
	defer db.Close()

	if err := db.Ping(context.Background()); err != nil {
		log.Fatalf("ping list_db: %v", err)
	}
	log.Println("connected to list_db")

	pub, err := events.NewPublisher(amqpURL)
	if err != nil {
		log.Fatalf("connect to rabbitmq: %v", err)
	}
	log.Println("connected to rabbitmq")

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

	repo := repository.NewListRepo(db)
	svc := service.NewListService(repo, pub)
	h := handler.New(svc)

	r := gin.Default()
	r.Use(middleware.Metrics())

	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	auth := middleware.Auth(jwtSecret)

	lists := r.Group("/api/v1/lists", auth)
	{
		lists.GET("/full", h.GetFullList)
		lists.GET("/sections", h.GetSections)
		lists.POST("/sections", h.CreateSection)
		lists.PUT("/sections/:id", h.UpdateSection)
		lists.DELETE("/sections/:id", h.DeleteSection)
		lists.GET("/sections/:id/items", h.GetItems)
		lists.POST("/sections/:id/items", h.CreateItem)
		lists.PUT("/items/:id", h.UpdateItem)
		lists.DELETE("/items/:id", h.DeleteItem)
	}

	// Start user.deleted event consumer (Option 1: event-driven saga).
	consumer, err := events.NewConsumer(amqpURL, func(ctx context.Context, userID string) error {
		return svc.SoftDeleteAllByUser(ctx, userID)
	})
	if err != nil {
		log.Printf("warning: could not start user.deleted consumer: %v", err)
	} else {
		go func() {
			if err := consumer.Start(context.Background()); err != nil {
				log.Printf("user.deleted consumer stopped: %v", err)
			}
		}()
	}

	// Start periodic orphan cleanup job (Option 4: safety net).
	orphanCleanup := cleanup.NewOrphanCleanup(db, userServiceURL, internalAPIKey, 10*time.Minute)
	go orphanCleanup.Start(context.Background())

	log.Printf("list-service listening on :%s", port)
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
