package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/metrics"
	amqp "github.com/rabbitmq/amqp091-go"
)

// UserDeletedHandler is called when a user.deleted event is received.
type UserDeletedHandler func(ctx context.Context, userID string) error

// Consumer listens for user lifecycle events from RabbitMQ.
type Consumer struct {
	amqpURL string
	handler UserDeletedHandler
}

type userEvent struct {
	Type   string `json:"type"`
	UserID string `json:"user_id"`
}

func NewConsumer(amqpURL string, handler UserDeletedHandler) (*Consumer, error) {
	// Verify connectivity on startup.
	conn, err := amqp.Dial(amqpURL)
	if err != nil {
		return nil, fmt.Errorf("connect to rabbitmq: %w", err)
	}
	_ = conn.Close()

	return &Consumer{amqpURL: amqpURL, handler: handler}, nil
}

func (c *Consumer) connect() (*amqp.Channel, error) {
	conn, err := amqp.Dial(c.amqpURL)
	if err != nil {
		return nil, fmt.Errorf("connect to rabbitmq: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return nil, fmt.Errorf("open channel: %w", err)
	}

	if err := ch.ExchangeDeclare("user", "fanout", true, false, false, false, nil); err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return nil, fmt.Errorf("declare exchange: %w", err)
	}

	q, err := ch.QueueDeclare("list.user-events", true, false, false, false, nil)
	if err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return nil, fmt.Errorf("declare queue: %w", err)
	}

	if err := ch.QueueBind(q.Name, "", "user", false, nil); err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return nil, fmt.Errorf("bind queue: %w", err)
	}

	return ch, nil
}

// Start begins consuming messages with automatic reconnection.
// Blocks until ctx is cancelled.
func (c *Consumer) Start(ctx context.Context) error {
	for {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		err := c.consumeLoop(ctx)
		if ctx.Err() != nil {
			return ctx.Err()
		}

		log.Printf("consumer: disconnected: %v — reconnecting in 5s", err)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(5 * time.Second):
		}
	}
}

func (c *Consumer) consumeLoop(ctx context.Context) error {
	ch, err := c.connect()
	if err != nil {
		return err
	}
	defer func() { _ = ch.Close() }()

	msgs, err := ch.Consume("list.user-events", "list-service", false, false, false, false, nil)
	if err != nil {
		return fmt.Errorf("start consuming: %w", err)
	}

	log.Println("consumer: listening for user.deleted events on list.user-events")

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case msg, ok := <-msgs:
			if !ok {
				return fmt.Errorf("consumer channel closed")
			}
			c.handleMessage(ctx, msg)
		}
	}
}

func (c *Consumer) handleMessage(ctx context.Context, msg amqp.Delivery) {
	var event userEvent
	if err := json.Unmarshal(msg.Body, &event); err != nil {
		log.Printf("consumer: invalid message, nacking: %v", err)
		if nackErr := msg.Nack(false, false); nackErr != nil {
			log.Printf("consumer: nack failed: %v", nackErr)
		}
		return
	}

	if event.Type != "user.deleted" {
		if ackErr := msg.Ack(false); ackErr != nil {
			log.Printf("consumer: ack failed: %v", ackErr)
		}
		return
	}

	log.Printf("consumer: received user.deleted for user %s", event.UserID)

	start := time.Now()
	if err := c.handler(ctx, event.UserID); err != nil {
		log.Printf("consumer: failed to handle user.deleted for %s: %v — requeueing", event.UserID, err)
		metrics.SagaCleanupErrors.Inc()
		if nackErr := msg.Nack(false, true); nackErr != nil {
			log.Printf("consumer: nack failed: %v", nackErr)
		}
		return
	}

	duration := time.Since(start).Seconds()
	metrics.SagaCleanupTotal.Inc()
	metrics.SagaCleanupDuration.Observe(duration)

	if ackErr := msg.Ack(false); ackErr != nil {
		log.Printf("consumer: ack failed: %v", ackErr)
	}
	log.Printf("consumer: successfully cleaned up data for deleted user %s (%.3fs)", event.UserID, duration)
}
