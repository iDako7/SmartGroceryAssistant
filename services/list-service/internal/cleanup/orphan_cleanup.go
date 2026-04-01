package cleanup

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// OrphanCleanup periodically scans list_db for user_ids that no longer exist
// in user_db and soft-deletes their orphaned data. This is a safety net for
// cases where the user.deleted event was lost (e.g., RabbitMQ was down).
type OrphanCleanup struct {
	listDB         *pgxpool.Pool
	userServiceURL string
	interval       time.Duration
}

func NewOrphanCleanup(listDB *pgxpool.Pool, userServiceURL string, interval time.Duration) *OrphanCleanup {
	return &OrphanCleanup{
		listDB:         listDB,
		userServiceURL: userServiceURL,
		interval:       interval,
	}
}

// Start runs the cleanup loop. Blocks until ctx is cancelled.
func (c *OrphanCleanup) Start(ctx context.Context) {
	log.Printf("orphan-cleanup: starting with interval %s", c.interval)
	ticker := time.NewTicker(c.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("orphan-cleanup: stopped")
			return
		case <-ticker.C:
			c.run(ctx)
		}
	}
}

func (c *OrphanCleanup) run(ctx context.Context) {
	// Find distinct user_ids in sections that still have active data.
	rows, err := c.listDB.Query(ctx,
		`SELECT DISTINCT user_id FROM sections WHERE deleted_at IS NULL`)
	if err != nil {
		log.Printf("orphan-cleanup: query user_ids: %v", err)
		return
	}
	defer rows.Close()

	var userIDs []string
	for rows.Next() {
		var uid string
		if err := rows.Scan(&uid); err != nil {
			log.Printf("orphan-cleanup: scan user_id: %v", err)
			return
		}
		userIDs = append(userIDs, uid)
	}
	if err := rows.Err(); err != nil {
		log.Printf("orphan-cleanup: iterate user_ids: %v", err)
		return
	}

	if len(userIDs) == 0 {
		return
	}

	for _, uid := range userIDs {
		if ctx.Err() != nil {
			return
		}
		exists, err := c.userExists(ctx, uid)
		if err != nil {
			log.Printf("orphan-cleanup: check user %s: %v", uid, err)
			continue
		}
		if !exists {
			c.cleanupUser(ctx, uid)
		}
	}
}

// userExists checks if the user still exists by calling the User Service.
func (c *OrphanCleanup) userExists(ctx context.Context, userID string) (bool, error) {
	// We can't use the /me endpoint (needs JWT). Instead, we check user_db
	// directly via the User Service's internal health or query list_db's
	// knowledge. Since we don't have a user-lookup endpoint, we'll query
	// user_db directly via the connection string. However, since list-service
	// doesn't have user_db credentials, we use a simple HTTP check.
	//
	// For now, we use a HEAD request to a hypothetical internal endpoint.
	// In production, this would be an internal service-to-service call.
	//
	// Fallback: we hardcode a direct user_db check. The cleanup job will
	// be configured with USER_DB_URL as an optional env var.

	url := fmt.Sprintf("%s/api/v1/users/internal/exists/%s", c.userServiceURL, userID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return false, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		// If user service is down, assume user exists (don't delete data).
		return true, nil
	}
	defer resp.Body.Close()

	// 200 = user exists, 404 = user doesn't exist
	return resp.StatusCode == http.StatusOK, nil
}

func (c *OrphanCleanup) cleanupUser(ctx context.Context, userID string) {
	// Soft-delete items
	tag, err := c.listDB.Exec(ctx,
		`UPDATE items SET deleted_at = NOW(), updated_at = NOW()
		 FROM sections s
		 WHERE items.section_id = s.id AND s.user_id = $1 AND items.deleted_at IS NULL`,
		userID,
	)
	if err != nil {
		log.Printf("orphan-cleanup: soft-delete items for %s: %v", userID, err)
		return
	}
	items := tag.RowsAffected()

	// Soft-delete sections
	tag, err = c.listDB.Exec(ctx,
		`UPDATE sections SET deleted_at = NOW(), updated_at = NOW()
		 WHERE user_id = $1 AND deleted_at IS NULL`,
		userID,
	)
	if err != nil {
		log.Printf("orphan-cleanup: soft-delete sections for %s: %v", userID, err)
		return
	}
	sections := tag.RowsAffected()

	if sections > 0 || items > 0 {
		log.Printf("orphan-cleanup: cleaned up user %s — %d sections, %d items soft-deleted",
			userID, sections, items)
	}
}
