package auditlogs

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/icatw/saas-starter/services/api/internal/httpx"
)

const (
	ActionUserDisable = "user.disable"
	ActionUserRestore = "user.restore"
	ResourceUser      = "user"
)

type Entry struct {
	ID           string          `json:"id"`
	ActorUserID  string          `json:"actorUserId"`
	ActorName    string          `json:"actorName"`
	ActorEmail   string          `json:"actorEmail"`
	Action       string          `json:"action"`
	ResourceType string          `json:"resourceType"`
	ResourceID   string          `json:"resourceId"`
	Metadata     json.RawMessage `json:"metadata"`
	RequestID    string          `json:"requestId"`
	CreatedAt    time.Time       `json:"createdAt"`
}

type writer interface {
	ExecContext(context.Context, string, ...any) (sql.Result, error)
}

// Insert writes one audit event inside the caller's transaction or connection.
func Insert(ctx context.Context, db writer, actorUserID, action, resourceType, resourceID, requestID string, metadata map[string]any) error {
	if metadata == nil {
		metadata = map[string]any{}
	}
	payload, err := json.Marshal(metadata)
	if err != nil {
		return err
	}
	idBytes := make([]byte, 16)
	if _, err := rand.Read(idBytes); err != nil {
		return err
	}
	_, err = db.ExecContext(ctx, `
		INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id, metadata, request_id)
		VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
		hex.EncodeToString(idBytes), actorUserID, action, resourceType, resourceID, string(payload), requestID)
	return err
}

func List(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.QueryContext(c.Request.Context(), `
			SELECT a.id, a.actor_user_id, COALESCE(u.name, ''), COALESCE(u.email, ''),
			       a.action, a.resource_type, a.resource_id, a.metadata, a.request_id, a.created_at
			FROM audit_logs a
			LEFT JOIN users u ON u.id = a.actor_user_id
			ORDER BY a.created_at DESC, a.id DESC
			LIMIT 100`)
		if err != nil {
			httpx.AbortInternal(c, "Unable to load audit logs")
			return
		}
		defer rows.Close()

		events := make([]Entry, 0)
		for rows.Next() {
			var current Entry
			var metadata []byte
			if err := rows.Scan(
				&current.ID,
				&current.ActorUserID,
				&current.ActorName,
				&current.ActorEmail,
				&current.Action,
				&current.ResourceType,
				&current.ResourceID,
				&metadata,
				&current.RequestID,
				&current.CreatedAt,
			); err != nil {
				httpx.AbortInternal(c, "Unable to load audit logs")
				return
			}
			if len(metadata) == 0 {
				current.Metadata = json.RawMessage(`{}`)
			} else {
				current.Metadata = json.RawMessage(metadata)
			}
			events = append(events, current)
		}
		if err := rows.Err(); err != nil {
			httpx.AbortInternal(c, "Unable to load audit logs")
			return
		}
		c.JSON(http.StatusOK, gin.H{"events": events})
	}
}
