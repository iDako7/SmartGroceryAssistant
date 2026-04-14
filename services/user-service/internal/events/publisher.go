package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

type EventType string

const (
	UserDeleted EventType = "user.deleted"
)

type UserEvent struct {
	Type    EventType `json:"type"`
	UserID  string    `json:"user_id"`
	Payload any       `json:"payload"`
}

type Publisher struct {
	ch *amqp.Channel
}

func NewPublisher(amqpURL string) (*Publisher, error) {
	conn, err := amqp.Dial(amqpURL)
	if err != nil {
		return nil, fmt.Errorf("connect to rabbitmq: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		return nil, fmt.Errorf("open channel: %w", err)
	}

	return &Publisher{ch: ch}, nil
}

// Channel returns the underlying AMQP channel for reuse by the outbox poller.
func (p *Publisher) Channel() *amqp.Channel { return p.ch }

func (p *Publisher) Publish(ctx context.Context, userID string, eventType EventType, payload any) error {
	event := UserEvent{Type: eventType, UserID: userID, Payload: payload}
	body, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal event: %w", err)
	}

	err = p.ch.PublishWithContext(ctx, "user", "", false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		Body:         body,
	})
	if err != nil {
		log.Printf("publish event %s: %v", eventType, err)
		return fmt.Errorf("publish event: %w", err)
	}
	return nil
}
