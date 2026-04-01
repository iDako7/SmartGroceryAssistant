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
	ch      *amqp.Channel
	handler UserDeletedHandler
}

type userEvent struct {
	Type   string `json:"type"`
	UserID string `json:"user_id"`
}

func NewConsumer(amqpURL string, handler UserDeletedHandler) (*Consumer, error) {
	conn, err := amqp.Dial(amqpURL)
	if err != nil {
		return nil, fmt.Errorf("connect to rabbitmq: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		return nil, fmt.Errorf("open channel: %w", err)
	}

	// Declare the exchange and queue, and bind them.
	if err := ch.ExchangeDeclare("user", "fanout", true, false, false, false, nil); err != nil {
		return nil, fmt.Errorf("declare exchange: %w", err)
	}

	q, err := ch.QueueDeclare("list.user-events", true, false, false, false, nil)
	if err != nil {
		return nil, fmt.Errorf("declare queue: %w", err)
	}

	if err := ch.QueueBind(q.Name, "", "user", false, nil); err != nil {
		return nil, fmt.Errorf("bind queue: %w", err)
	}

	return &Consumer{ch: ch, handler: handler}, nil
}

// Start begins consuming messages. Blocks until the channel is closed.
func (c *Consumer) Start(ctx context.Context) error {
	msgs, err := c.ch.Consume("list.user-events", "list-service", false, false, false, false, nil)
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
		msg.Nack(false, false)
		return
	}

	if event.Type != "user.deleted" {
		msg.Ack(false)
		return
	}

	log.Printf("consumer: received user.deleted for user %s", event.UserID)

	start := time.Now()
	if err := c.handler(ctx, event.UserID); err != nil {
		log.Printf("consumer: failed to handle user.deleted for %s: %v — requeueing", event.UserID, err)
		metrics.SagaCleanupErrors.Inc()
		msg.Nack(false, true)
		return
	}

	duration := time.Since(start).Seconds()
	metrics.SagaCleanupTotal.Inc()
	metrics.SagaCleanupDuration.Observe(duration)

	msg.Ack(false)
	log.Printf("consumer: successfully cleaned up data for deleted user %s (%.3fs)", event.UserID, duration)
}
