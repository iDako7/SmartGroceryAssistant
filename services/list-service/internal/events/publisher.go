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
	SectionCreated EventType = "section.created"
	SectionUpdated EventType = "section.updated"
	SectionDeleted EventType = "section.deleted"
	ItemCreated    EventType = "item.created"
	ItemUpdated    EventType = "item.updated"
	ItemDeleted    EventType = "item.deleted"
)

type ListEvent struct {
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

func (p *Publisher) Publish(ctx context.Context, userID string, eventType EventType, payload any) {
	event := ListEvent{Type: eventType, UserID: userID, Payload: payload}
	body, err := json.Marshal(event)
	if err != nil {
		log.Printf("marshal event: %v", err)
		return
	}

	err = p.ch.PublishWithContext(ctx, "list", "", false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		Body:         body,
	})
	if err != nil {
		log.Printf("publish event %s: %v", eventType, err)
	}
}
