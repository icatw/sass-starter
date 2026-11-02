package tasks

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"

	"github.com/icatw/saas-starter/services/api/internal/authz"
	"github.com/icatw/saas-starter/services/api/internal/httpx"
)

type Task struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Completed bool      `json:"completed"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func List(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.QueryContext(c.Request.Context(), `
			SELECT id, title, completed, created_at, updated_at
			FROM tasks WHERE user_id = $1
			ORDER BY updated_at DESC, id DESC LIMIT 100`, authz.CurrentUserID(c))
		if err != nil {
			httpx.AbortInternal(c, "Unable to load tasks")
			return
		}
		defer rows.Close()
		items := make([]Task, 0)
		for rows.Next() {
			var current Task
			if err := rows.Scan(&current.ID, &current.Title, &current.Completed, &current.CreatedAt, &current.UpdatedAt); err != nil {
				httpx.AbortInternal(c, "Unable to load tasks")
				return
			}
			items = append(items, current)
		}
		if err := rows.Err(); err != nil {
			httpx.AbortInternal(c, "Unable to load tasks")
			return
		}
		c.JSON(http.StatusOK, gin.H{"tasks": items})
	}
}

func Create(db *sql.DB) gin.HandlerFunc {
	type request struct {
		Title string `json:"title"`
	}
	return func(c *gin.Context) {
		var input request
		if err := c.ShouldBindJSON(&input); err != nil {
			httpx.AbortBadRequest(c, "INVALID_TASK", "A task title is required")
			return
		}
		input.Title = strings.TrimSpace(input.Title)
		if length := utf8.RuneCountInString(input.Title); length < 1 || length > 200 {
			httpx.AbortBadRequest(c, "INVALID_TASK", "Task title must contain 1 to 200 characters")
			return
		}
		idBytes := make([]byte, 16)
		if _, err := rand.Read(idBytes); err != nil {
			httpx.AbortInternal(c, "Unable to create task")
			return
		}
		id := hex.EncodeToString(idBytes)
		var created Task
		err := db.QueryRowContext(c.Request.Context(), `
			INSERT INTO tasks (id, user_id, title)
			VALUES ($1, $2, $3)
			RETURNING id, title, completed, created_at, updated_at`, id, authz.CurrentUserID(c), input.Title).
			Scan(&created.ID, &created.Title, &created.Completed, &created.CreatedAt, &created.UpdatedAt)
		if err != nil {
			httpx.AbortInternal(c, "Unable to create task")
			return
		}
		c.JSON(http.StatusCreated, gin.H{"task": created})
	}
}

func Update(db *sql.DB) gin.HandlerFunc {
	type request struct {
		Completed *bool `json:"completed"`
	}
	return func(c *gin.Context) {
		var input request
		if err := c.ShouldBindJSON(&input); err != nil || input.Completed == nil {
			httpx.AbortBadRequest(c, "INVALID_TASK", "A completion state is required")
			return
		}
		var updated Task
		err := db.QueryRowContext(c.Request.Context(), `
			UPDATE tasks SET completed = $1, updated_at = CURRENT_TIMESTAMP
			WHERE id = $2 AND user_id = $3
			RETURNING id, title, completed, created_at, updated_at`, *input.Completed, c.Param("taskId"), authz.CurrentUserID(c)).
			Scan(&updated.ID, &updated.Title, &updated.Completed, &updated.CreatedAt, &updated.UpdatedAt)
		if errors.Is(err, sql.ErrNoRows) {
			httpx.AbortNotFound(c, "TASK_NOT_FOUND", "Task not found")
			return
		}
		if err != nil {
			httpx.AbortInternal(c, "Unable to update task")
			return
		}
		c.JSON(http.StatusOK, gin.H{"task": updated})
	}
}

func Delete(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		result, err := db.ExecContext(c.Request.Context(), `DELETE FROM tasks WHERE id = $1 AND user_id = $2`, c.Param("taskId"), authz.CurrentUserID(c))
		if err != nil {
			httpx.AbortInternal(c, "Unable to delete task")
			return
		}
		deleted, err := result.RowsAffected()
		if err != nil {
			httpx.AbortInternal(c, "Unable to delete task")
			return
		}
		if deleted == 0 {
			httpx.AbortNotFound(c, "TASK_NOT_FOUND", "Task not found")
			return
		}
		c.Status(http.StatusNoContent)
	}
}
