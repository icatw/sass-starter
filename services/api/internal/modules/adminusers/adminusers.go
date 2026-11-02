package adminusers

import (
	"database/sql"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/icatw/saas-starter/services/api/internal/authz"
	"github.com/icatw/saas-starter/services/api/internal/httpx"
	"github.com/icatw/saas-starter/services/api/internal/modules/auditlogs"
)

type User struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	Role          string    `json:"role"`
	EmailVerified bool      `json:"emailVerified"`
	Disabled      bool      `json:"disabled"`
	CreatedAt     time.Time `json:"createdAt"`
}

func List(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.QueryContext(c.Request.Context(), `
			SELECT id, name, email, COALESCE(role, 'user'), email_verified,
			       COALESCE(disabled, false), created_at
			FROM users
			ORDER BY created_at DESC, id DESC
			LIMIT 100`)
		if err != nil {
			httpx.AbortInternal(c, "Unable to load users")
			return
		}
		defer rows.Close()

		users := make([]User, 0)
		for rows.Next() {
			var current User
			if err := rows.Scan(&current.ID, &current.Name, &current.Email, &current.Role, &current.EmailVerified, &current.Disabled, &current.CreatedAt); err != nil {
				httpx.AbortInternal(c, "Unable to load users")
				return
			}
			users = append(users, current)
		}
		if err := rows.Err(); err != nil {
			httpx.AbortInternal(c, "Unable to load users")
			return
		}
		c.JSON(http.StatusOK, gin.H{"users": users})
	}
}

func UpdateStatus(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			Disabled *bool `json:"disabled"`
		}
		if err := c.ShouldBindJSON(&input); err != nil || input.Disabled == nil {
			httpx.AbortBadRequest(c, "INVALID_USER_STATUS", "disabled must be provided as a boolean")
			return
		}

		targetID := c.Param("userId")
		if targetID == "" {
			httpx.AbortBadRequest(c, "INVALID_USER_STATUS", "userId is required")
			return
		}

		actor := authz.CurrentUserID(c)
		if targetID == actor {
			httpx.AbortForbidden(c, "FORBIDDEN", "Administrators cannot change their own account status")
			return
		}

		tx, err := db.BeginTx(c.Request.Context(), nil)
		if err != nil {
			httpx.AbortInternal(c, "Unable to update user status")
			return
		}
		defer tx.Rollback()

		var (
			current User
			role    string
		)
		err = tx.QueryRowContext(c.Request.Context(), `
			SELECT id, name, email, COALESCE(role, 'user'), email_verified,
			       COALESCE(disabled, false), created_at
			FROM users WHERE id = $1
			FOR UPDATE`, targetID).
			Scan(&current.ID, &current.Name, &current.Email, &role, &current.EmailVerified, &current.Disabled, &current.CreatedAt)
		if errors.Is(err, sql.ErrNoRows) {
			httpx.AbortNotFound(c, "USER_NOT_FOUND", "User not found")
			return
		}
		if err != nil {
			httpx.AbortInternal(c, "Unable to update user status")
			return
		}
		current.Role = role

		if *input.Disabled && role == "admin" && !current.Disabled {
			var activeAdmins int
			if err := tx.QueryRowContext(c.Request.Context(), `
				SELECT COUNT(*) FROM users
				WHERE COALESCE(role, 'user') = 'admin' AND COALESCE(disabled, false) = false`).
				Scan(&activeAdmins); err != nil {
				httpx.AbortInternal(c, "Unable to update user status")
				return
			}
			if activeAdmins <= 1 {
				httpx.Abort(c, http.StatusConflict, "LAST_ADMIN", "Cannot disable the last active administrator")
				return
			}
		}

		err = tx.QueryRowContext(c.Request.Context(), `
			UPDATE users
			SET disabled = $1, updated_at = CURRENT_TIMESTAMP
			WHERE id = $2
			RETURNING id, name, email, COALESCE(role, 'user'), email_verified,
			          COALESCE(disabled, false), created_at`, *input.Disabled, targetID).
			Scan(&current.ID, &current.Name, &current.Email, &current.Role, &current.EmailVerified, &current.Disabled, &current.CreatedAt)
		if err != nil {
			httpx.AbortInternal(c, "Unable to update user status")
			return
		}

		if *input.Disabled {
			if _, err := tx.ExecContext(c.Request.Context(), `DELETE FROM sessions WHERE user_id = $1`, targetID); err != nil {
				httpx.AbortInternal(c, "Unable to revoke user sessions")
				return
			}
		}

		action := auditlogs.ActionUserRestore
		if *input.Disabled {
			action = auditlogs.ActionUserDisable
		}
		if err := auditlogs.Insert(
			c.Request.Context(),
			tx,
			actor,
			action,
			auditlogs.ResourceUser,
			targetID,
			httpx.RequestIDFrom(c),
			map[string]any{
				"disabled":      *input.Disabled,
				"targetEmail":   current.Email,
				"targetRole":    current.Role,
				"emailVerified": current.EmailVerified,
			},
		); err != nil {
			httpx.AbortInternal(c, "Unable to record audit log")
			return
		}

		if err := tx.Commit(); err != nil {
			httpx.AbortInternal(c, "Unable to update user status")
			return
		}
		c.JSON(http.StatusOK, gin.H{"user": current})
	}
}
