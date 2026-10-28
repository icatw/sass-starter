package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	_ "github.com/jackc/pgx/v5/stdlib"
	"golang.org/x/time/rate"
)

type user struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}

type adminUser struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	Role          string    `json:"role"`
	EmailVerified bool      `json:"emailVerified"`
	Disabled      bool      `json:"disabled"`
	CreatedAt     time.Time `json:"createdAt"`
}

type task struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Completed bool      `json:"completed"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func currentUserID(c *gin.Context) string {
	return c.MustGet("user").(user).ID
}

func listTasks(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.QueryContext(c.Request.Context(), `
			SELECT id, title, completed, created_at, updated_at
			FROM tasks WHERE user_id = $1
			ORDER BY updated_at DESC, id DESC LIMIT 100`, currentUserID(c))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_ERROR", "message": "Unable to load tasks"})
			return
		}
		defer rows.Close()
		tasks := make([]task, 0)
		for rows.Next() {
			var current task
			if err := rows.Scan(&current.ID, &current.Title, &current.Completed, &current.CreatedAt, &current.UpdatedAt); err != nil {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_ERROR", "message": "Unable to load tasks"})
				return
			}
			tasks = append(tasks, current)
		}
		if err := rows.Err(); err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_ERROR", "message": "Unable to load tasks"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"tasks": tasks})
	}
}

func createTask(db *sql.DB) gin.HandlerFunc {
	type request struct {
		Title string `json:"title"`
	}
	return func(c *gin.Context) {
		var input request
		if err := c.ShouldBindJSON(&input); err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"code": "INVALID_TASK", "message": "A task title is required"})
			return
		}
		input.Title = strings.TrimSpace(input.Title)
		if length := utf8.RuneCountInString(input.Title); length < 1 || length > 200 {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"code": "INVALID_TASK", "message": "Task title must contain 1 to 200 characters"})
			return
		}
		idBytes := make([]byte, 16)
		if _, err := rand.Read(idBytes); err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_ERROR", "message": "Unable to create task"})
			return
		}
		id := hex.EncodeToString(idBytes)
		var created task
		err := db.QueryRowContext(c.Request.Context(), `
			INSERT INTO tasks (id, user_id, title)
			VALUES ($1, $2, $3)
			RETURNING id, title, completed, created_at, updated_at`, id, currentUserID(c), input.Title).
			Scan(&created.ID, &created.Title, &created.Completed, &created.CreatedAt, &created.UpdatedAt)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_ERROR", "message": "Unable to create task"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"task": created})
	}
}

func updateTask(db *sql.DB) gin.HandlerFunc {
	type request struct {
		Completed *bool `json:"completed"`
	}
	return func(c *gin.Context) {
		var input request
		if err := c.ShouldBindJSON(&input); err != nil || input.Completed == nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"code": "INVALID_TASK", "message": "A completion state is required"})
			return
		}
		var updated task
		err := db.QueryRowContext(c.Request.Context(), `
			UPDATE tasks SET completed = $1, updated_at = CURRENT_TIMESTAMP
			WHERE id = $2 AND user_id = $3
			RETURNING id, title, completed, created_at, updated_at`, *input.Completed, c.Param("taskId"), currentUserID(c)).
			Scan(&updated.ID, &updated.Title, &updated.Completed, &updated.CreatedAt, &updated.UpdatedAt)
		if errors.Is(err, sql.ErrNoRows) {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"code": "TASK_NOT_FOUND", "message": "Task not found"})
			return
		}
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_ERROR", "message": "Unable to update task"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"task": updated})
	}
}

func deleteTask(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		result, err := db.ExecContext(c.Request.Context(), `DELETE FROM tasks WHERE id = $1 AND user_id = $2`, c.Param("taskId"), currentUserID(c))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_ERROR", "message": "Unable to delete task"})
			return
		}
		deleted, err := result.RowsAffected()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_ERROR", "message": "Unable to delete task"})
			return
		}
		if deleted == 0 {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"code": "TASK_NOT_FOUND", "message": "Task not found"})
			return
		}
		c.Status(http.StatusNoContent)
	}
}

func listAdminUsers(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.QueryContext(c.Request.Context(), `
			SELECT id, name, email, COALESCE(role, 'user'), email_verified,
			       COALESCE(disabled, false), created_at
			FROM users
			ORDER BY created_at DESC, id DESC
			LIMIT 100`)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_ERROR", "message": "Unable to load users"})
			return
		}
		defer rows.Close()

		users := make([]adminUser, 0)
		for rows.Next() {
			var current adminUser
			if err := rows.Scan(&current.ID, &current.Name, &current.Email, &current.Role, &current.EmailVerified, &current.Disabled, &current.CreatedAt); err != nil {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_ERROR", "message": "Unable to load users"})
				return
			}
			users = append(users, current)
		}
		if err := rows.Err(); err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_ERROR", "message": "Unable to load users"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"users": users})
	}
}

func authenticate(db *sql.DB, jwks keyfunc.Keyfunc, issuer string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"code": "UNAUTHENTICATED", "message": "Authentication required"})
			return
		}
		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(parts[1], claims, jwks.Keyfunc,
			jwt.WithValidMethods([]string{jwt.SigningMethodEdDSA.Alg()}),
			jwt.WithIssuer(issuer), jwt.WithAudience("saas-api"), jwt.WithExpirationRequired(),
			jwt.WithLeeway(5*time.Second))
		if err != nil || token == nil || !token.Valid || claims["sub"] == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"code": "UNAUTHENTICATED", "message": "Invalid or expired credential"})
			return
		}
		sub, ok := claims["sub"].(string)
		if !ok || sub == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"code": "UNAUTHENTICATED", "message": "Invalid subject"})
			return
		}
		var current user
		var verified, disabled bool
		err = db.QueryRowContext(c.Request.Context(), `SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1`, sub).
			Scan(&current.ID, &current.Email, &current.Name, &current.Role, &verified, &disabled)
		if errors.Is(err, sql.ErrNoRows) || (err == nil && (!verified || disabled)) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"code": "UNAUTHENTICATED", "message": "Account is unavailable"})
			return
		}
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_ERROR", "message": "Unable to load account"})
			return
		}
		c.Set("user", current)
		c.Next()
	}
}

func requireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		current := c.MustGet("user").(user)
		if current.Role != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"code": "FORBIDDEN", "message": "Administrator access required"})
			return
		}
		c.Next()
	}
}

func requireSameOrigin(allowed string) gin.HandlerFunc {
	allowedURL, err := url.Parse(allowed)
	if err != nil || allowedURL.Scheme == "" || allowedURL.Host == "" {
		panic("authentication issuer must be an absolute URL")
	}
	allowedOrigin := allowedURL.Scheme + "://" + allowedURL.Host
	return func(c *gin.Context) {
		switch c.Request.Method {
		case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
			origin, err := url.Parse(c.GetHeader("Origin"))
			if err != nil || origin.Scheme+"://"+origin.Host != allowedOrigin {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"code": "INVALID_ORIGIN", "message": "Request origin is not allowed"})
				return
			}
		}
		c.Next()
	}
}

func main() {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	databaseURL := os.Getenv("DATABASE_URL")
	issuer := os.Getenv("BETTER_AUTH_URL")
	if issuer == "" {
		issuer = os.Getenv("NEXT_PUBLIC_APP_URL")
	}
	if databaseURL == "" || issuer == "" {
		panic("DATABASE_URL and BETTER_AUTH_URL (or NEXT_PUBLIC_APP_URL) are required")
	}
	r.Use(requireSameOrigin(issuer))
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		panic(err)
	}
	defer db.Close()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	keyset, err := keyfunc.NewDefaultOverrideCtx(ctx, []string{strings.TrimRight(issuer, "/") + "/api/auth/jwks"}, keyfunc.Override{
		RefreshInterval:   time.Hour,
		RefreshUnknownKID: rate.NewLimiter(rate.Every(5*time.Second), 1),
	})
	if err != nil {
		panic(err)
	}

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "api",
		})
	})
	protected := r.Group("/v1", authenticate(db, keyset, issuer))
	protected.GET("/me", func(c *gin.Context) { c.JSON(http.StatusOK, c.MustGet("user")) })
	protected.GET("/admin/health", requireAdmin(), func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })
	protected.GET("/admin/users", requireAdmin(), listAdminUsers(db))
	protected.GET("/tasks", listTasks(db))
	protected.POST("/tasks", createTask(db))
	protected.PATCH("/tasks/:taskId", updateTask(db))
	protected.DELETE("/tasks/:taskId", deleteTask(db))

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	if err := r.Run(":" + port); err != nil {
		panic(err)
	}
}
