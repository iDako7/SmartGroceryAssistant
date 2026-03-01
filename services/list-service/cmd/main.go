package main

import (
	"context"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/events"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/handler"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/middleware"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/repository"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load("../../.env")

	dbURL := mustEnv("LIST_DB_URL")
	jwtSecret := mustEnv("JWT_SECRET")
	amqpURL := getEnv("RABBITMQ_URL", "amqp://sga:sga_secret@localhost:5672/")
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

	repo := repository.NewListRepo(db)
	svc := service.NewListService(repo, pub)
	h := handler.New(svc)

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })

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
