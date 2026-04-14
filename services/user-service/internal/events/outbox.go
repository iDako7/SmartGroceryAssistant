package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// OutboxRow represents an unpublished event from the outbox table.
type OutboxRow struct {
	ID        string
	EventType string
	Payload   []byte
}

// OutboxPoller reads unpublished events from the outbox table and publishes
// them to RabbitMQ. It runs in a background goroutine.
type OutboxPoller struct {
	fetch    func(ctx context.Context, limit int) ([]OutboxRow, error)
	mark     func(ctx context.Context, id string) error
	ch       *amqp.Channel
	interval time.Duration
}

func NewOutboxPoller(
	fetch func(ctx context.Context, limit int) ([]OutboxRow, error),
	mark func(ctx context.Context, id string) error,
	ch *amqp.Channel,
	interval time.Duration,
) *OutboxPoller {
	return &OutboxPoller{fetch: fetch, mark: mark, ch: ch, interval: interval}
}

// Run polls the outbox table at the configured interval until ctx is cancelled.
func (p *OutboxPoller) Run(ctx context.Context) {
	log.Printf("outbox poller started (interval=%v)", p.interval)
	ticker := time.NewTicker(p.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("outbox poller stopped")
			return
		case <-ticker.C:
			p.poll(ctx)
		}
	}
}

func (p *OutboxPoller) poll(ctx context.Context) {
	rows, err := p.fetch(ctx, 100)
	if err != nil {
		log.Printf("outbox poll error: %v", err)
		return
	}

	for _, row := range rows {
		// Build the full event JSON the consumer expects:
		// {"type":"user.deleted","user_id":"...","payload":{...}}
		body := buildEventBody(row.EventType, row.Payload)

		err := p.ch.PublishWithContext(ctx, "user", "", false, false, amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Body:         body,
		})
		if err != nil {
			log.Printf("outbox publish %s failed: %v", row.ID, err)
			continue // retry on next poll
		}

		if err := p.mark(ctx, row.ID); err != nil {
			// Published but not marked — will be re-published (duplicate).
			// Consumer is idempotent, so this is safe.
			log.Printf("outbox mark-published %s failed: %v", row.ID, err)
		}
	}
}

// buildEventBody wraps the raw outbox payload into the event envelope
// that the list-service consumer expects.
// Outbox payload is {"user_id":"<id>"} from jsonb_build_object.
// Consumer expects {"type":"user.deleted","user_id":"<id>","payload":{"user_id":"<id>"}}.
func buildEventBody(eventType string, payload []byte) []byte {
	var p map[string]any
	_ = json.Unmarshal(payload, &p)

	envelope := UserEvent{
		Type:    EventType(eventType),
		UserID:  fmt.Sprint(p["user_id"]),
		Payload: p,
	}
	body, _ := json.Marshal(envelope)
	return body
}
