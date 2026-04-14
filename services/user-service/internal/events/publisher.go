package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

const exchangeName = "user"

type UserEvent struct {
	Type   string `json:"type"`
	UserID string `json:"user_id"`
}

type Publisher struct {
	amqpURL string
	conn    *amqp.Connection
	ch      *amqp.Channel
	mu      sync.Mutex
}

func NewPublisher(amqpURL string) (*Publisher, error) {
	p := &Publisher{amqpURL: amqpURL}
	if err := p.connect(); err != nil {
		return nil, err
	}
	return p, nil
}

func (p *Publisher) connect() error {
	conn, err := amqp.Dial(p.amqpURL)
	if err != nil {
		return fmt.Errorf("connect to rabbitmq: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return fmt.Errorf("open channel: %w", err)
	}

	if err := ch.ExchangeDeclare(exchangeName, "fanout", true, false, false, false, nil); err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return fmt.Errorf("declare exchange: %w", err)
	}

	p.conn = conn
	p.ch = ch
	return nil
}

func (p *Publisher) reconnect() error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.ch != nil {
		_ = p.ch.Close()
	}
	if p.conn != nil {
		_ = p.conn.Close()
	}
	return p.connect()
}

// Channel returns the underlying AMQP channel for reuse by the outbox poller.
func (p *Publisher) Channel() *amqp.Channel {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.ch
}

func (p *Publisher) PublishUserDeleted(ctx context.Context, userID string) error {
	event := UserEvent{Type: "user.deleted", UserID: userID}
	body, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal event: %w", err)
	}

	p.mu.Lock()
	ch := p.ch
	p.mu.Unlock()

	pubCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	err = ch.PublishWithContext(pubCtx, exchangeName, "", false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		Body:         body,
	})
	if err != nil {
		log.Printf("publish user.deleted failed: %v — attempting reconnect", err)
		if reconnErr := p.reconnect(); reconnErr != nil {
			return fmt.Errorf("publish user.deleted after reconnect failure: %w", reconnErr)
		}
		// Retry once after reconnect.
		p.mu.Lock()
		ch = p.ch
		p.mu.Unlock()
		pubCtx2, cancel2 := context.WithTimeout(ctx, 5*time.Second)
		defer cancel2()
		if err := ch.PublishWithContext(pubCtx2, exchangeName, "", false, false, amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Body:         body,
		}); err != nil {
			return fmt.Errorf("publish user.deleted after reconnect: %w", err)
		}
	}

	log.Printf("published user.deleted event for user %s", userID)
	return nil
}
