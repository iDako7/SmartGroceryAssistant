package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// UserEvent mirrors the event envelope published by the user-service.
type UserEvent struct {
	Type    string `json:"type"`
	UserID  string `json:"user_id"`
	Payload any    `json:"payload"`
}

// UserDataCleaner is the interface the consumer calls to clean up user data.
type UserDataCleaner interface {
	SoftDeleteAllByUser(ctx context.Context, userID string) (int64, int64, error)
}

// Consumer listens on the user.events queue for saga events.
type Consumer struct {
	ch      *amqp.Channel
	cleaner UserDataCleaner
}

func NewConsumer(amqpURL string, cleaner UserDataCleaner) (*Consumer, error) {
	conn, err := amqp.Dial(amqpURL)
	if err != nil {
		return nil, fmt.Errorf("connect to rabbitmq: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		return nil, fmt.Errorf("open channel: %w", err)
	}

	return &Consumer{ch: ch, cleaner: cleaner}, nil
}

// Start begins consuming messages in a background goroutine. It blocks until
// ctx is cancelled or the channel is closed.
func (c *Consumer) Start(ctx context.Context) error {
	msgs, err := c.ch.Consume(
		"user.events", // queue
		"",            // consumer tag (auto-generated)
		false,         // auto-ack disabled — we ack after processing
		false,         // exclusive
		false,         // no-local
		false,         // no-wait
		nil,           // args
	)
	if err != nil {
		return fmt.Errorf("consume user.events: %w", err)
	}

	log.Println("saga consumer: listening on user.events")

	go func() {
		for {
			select {
			case <-ctx.Done():
				log.Println("saga consumer: context cancelled, stopping")
				return
			case msg, ok := <-msgs:
				if !ok {
					log.Println("saga consumer: channel closed, stopping")
					return
				}
				c.handleMessage(ctx, msg)
			}
		}
	}()

	return nil
}

func (c *Consumer) handleMessage(ctx context.Context, msg amqp.Delivery) {
	start := time.Now()

	var event UserEvent
	if err := json.Unmarshal(msg.Body, &event); err != nil {
		log.Printf("saga consumer: unmarshal error: %v", err)
		// Nack without requeue — malformed messages won't fix themselves
		_ = msg.Nack(false, false)
		return
	}

	switch event.Type {
	case "user.deleted":
		sections, items, err := c.cleaner.SoftDeleteAllByUser(ctx, event.UserID)
		if err != nil {
			log.Printf("saga consumer: cleanup failed for user %s: %v", event.UserID, err)
			// Nack with requeue — transient failures should be retried
			_ = msg.Nack(false, true)
			return
		}
		elapsed := time.Since(start)
		log.Printf("saga consumer: cleaned user %s — %d sections, %d items in %v",
			event.UserID, sections, items, elapsed)
		_ = msg.Ack(false)

	default:
		log.Printf("saga consumer: unknown event type %q, acking", event.Type)
		_ = msg.Ack(false)
	}
}
