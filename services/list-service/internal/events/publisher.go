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
	amqpURL string
	conn    *amqp.Connection
	ch      *amqp.Channel
	mu      sync.Mutex
	queue   chan publishMsg
	done    chan struct{}
}

type publishMsg struct {
	userID    string
	eventType EventType
	payload   any
}

const (
	exchangeName = "list"
	queueSize    = 256
)

func NewPublisher(amqpURL string) (*Publisher, error) {
	p := &Publisher{
		amqpURL: amqpURL,
		queue:   make(chan publishMsg, queueSize),
		done:    make(chan struct{}),
	}

	if err := p.connect(); err != nil {
		return nil, err
	}

	// Background worker drains the publish queue — keeps publishing
	// off the HTTP request path entirely.
	go p.publishLoop()

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

	// Declare the exchange so publishing doesn't fail on a missing exchange.
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

	// Close stale resources.
	if p.ch != nil {
		_ = p.ch.Close()
	}
	if p.conn != nil {
		_ = p.conn.Close()
	}

	return p.connect()
}

// Publish enqueues an event to be published asynchronously.
// It never blocks the caller — if the queue is full the event is dropped.
func (p *Publisher) Publish(_ context.Context, userID string, eventType EventType, payload any) {
	select {
	case p.queue <- publishMsg{userID: userID, eventType: eventType, payload: payload}:
	default:
		log.Printf("publish queue full, dropping event %s for user %s", eventType, userID)
	}
}

func (p *Publisher) publishLoop() {
	for msg := range p.queue {
		p.doPublish(msg)
	}
	close(p.done)
}

func (p *Publisher) doPublish(msg publishMsg) {
	event := ListEvent{Type: msg.eventType, UserID: msg.userID, Payload: msg.payload}
	body, err := json.Marshal(event)
	if err != nil {
		log.Printf("marshal event: %v", err)
		return
	}

	p.mu.Lock()
	ch := p.ch
	p.mu.Unlock()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = ch.PublishWithContext(ctx, exchangeName, "", false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		Body:         body,
	})
	if err != nil {
		log.Printf("publish event %s failed: %v — attempting reconnect", msg.eventType, err)
		if reconnErr := p.reconnect(); reconnErr != nil {
			log.Printf("reconnect failed: %v", reconnErr)
			return
		}
		// Retry once after reconnect.
		p.mu.Lock()
		ch = p.ch
		p.mu.Unlock()
		ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel2()
		if err := ch.PublishWithContext(ctx2, exchangeName, "", false, false, amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Body:         body,
		}); err != nil {
			log.Printf("publish event %s failed after reconnect: %v", msg.eventType, err)
		}
	}
}

// Close shuts down the publisher gracefully.
func (p *Publisher) Close() {
	close(p.queue)
	<-p.done
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.ch != nil {
		_ = p.ch.Close()
	}
	if p.conn != nil {
		_ = p.conn.Close()
	}
}
