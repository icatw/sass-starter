package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/MicahParks/keyfunc/v3"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const testIssuer = "http://auth.example.test"

func TestAuthenticationAndAdminAuthorization(t *testing.T) {
	gin.SetMode(gin.TestMode)
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	jwksJSON, err := json.Marshal(map[string]any{"keys": []any{map[string]string{
		"kty": "OKP", "crv": "Ed25519", "alg": "EdDSA", "use": "sig", "kid": "test-key",
		"x": base64.RawURLEncoding.EncodeToString(publicKey),
	}}})
	if err != nil {
		t.Fatal(err)
	}
	keyset, err := keyfunc.NewJWKSetJSON(json.RawMessage(jwksJSON))
	if err != nil {
		t.Fatal(err)
	}

	t.Run("missing credential is 401", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		r := testRouter(db, keyset)
		response := httptest.NewRecorder()
		r.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/v1/me", nil))
		if response.Code != http.StatusUnauthorized {
			t.Fatalf("got %d, want 401", response.Code)
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("expired credential is 401", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "user-1", time.Now().Add(-time.Minute)))
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusUnauthorized {
			t.Fatalf("got %d, want 401", response.Code)
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("incorrect signature is 401", func(t *testing.T) {
		_, wrongPrivateKey, err := ed25519.GenerateKey(rand.Reader)
		if err != nil {
			t.Fatal(err)
		}
		db, mock, _ := sqlmock.New()
		defer db.Close()
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, wrongPrivateKey, "user-1", time.Now().Add(time.Minute)))
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusUnauthorized {
			t.Fatalf("got %d, want 401", response.Code)
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("database role denies regular user with 403", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("user-1", "user@example.test", "User", "user", true, false))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodGet, "/v1/admin/health", nil)
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "user-1", time.Now().Add(time.Minute)))
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusForbidden {
			t.Fatalf("got %d, want 403", response.Code)
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("database role allows administrator", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("admin-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("admin-1", "admin@example.test", "Admin", "admin", true, false))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodGet, "/v1/admin/health", nil)
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "admin-1", time.Now().Add(time.Minute)))
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusOK {
			t.Fatalf("got %d, want 200: %s", response.Code, response.Body.String())
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("administrator can list users with sensitive fields omitted", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		createdAt := time.Date(2026, time.January, 10, 12, 0, 0, 0, time.UTC)
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("admin-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("admin-1", "admin@example.test", "Admin", "admin", true, false))
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, name, email, COALESCE(role, 'user'), email_verified,")).
			WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "role", "email_verified", "disabled", "created_at"}).
				AddRow("user-1", "Example User", "user@example.test", "user", true, false, createdAt))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodGet, "/v1/admin/users", nil)
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "admin-1", time.Now().Add(time.Minute)))
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusOK {
			t.Fatalf("got %d, want 200: %s", response.Code, response.Body.String())
		}
		var result struct {
			Users []map[string]any `json:"users"`
		}
		if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
			t.Fatal(err)
		}
		if len(result.Users) != 1 || result.Users[0]["email"] != "user@example.test" {
			t.Fatalf("unexpected user list: %s", response.Body.String())
		}
		if _, ok := result.Users[0]["password"]; ok {
			t.Fatal("user list must not expose password fields")
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("regular user cannot list users", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("user-1", "user@example.test", "User", "user", true, false))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodGet, "/v1/admin/users", nil)
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "user-1", time.Now().Add(time.Minute)))
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusForbidden {
			t.Fatalf("got %d, want 403", response.Code)
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("task queries are scoped to authenticated user", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("user-1", "user@example.test", "User", "user", true, false))
		mock.ExpectQuery(regexp.QuoteMeta("UPDATE tasks SET completed = $1, updated_at = CURRENT_TIMESTAMP")).
			WithArgs(true, "other-users-task", "user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "title", "completed", "created_at", "updated_at"}))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodPatch, "/v1/tasks/other-users-task", strings.NewReader(`{"completed":true}`))
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "user-1", time.Now().Add(time.Minute)))
		request.Header.Set("Content-Type", "application/json")
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusNotFound {
			t.Fatalf("got %d, want 404: %s", response.Code, response.Body.String())
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("task creation rejects blank title", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("user-1", "user@example.test", "User", "user", true, false))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodPost, "/v1/tasks", strings.NewReader(`{"title":"   ","userId":"admin-1"}`))
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "user-1", time.Now().Add(time.Minute)))
		request.Header.Set("Content-Type", "application/json")
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusBadRequest {
			t.Fatalf("got %d, want 400: %s", response.Code, response.Body.String())
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("task creation binds ownership to authenticated subject", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		createdAt := time.Date(2026, time.January, 10, 12, 0, 0, 0, time.UTC)
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("user-1", "user@example.test", "User", "user", true, false))
		mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO tasks (id, user_id, title)")).
			WithArgs(sqlmock.AnyArg(), "user-1", "My task").
			WillReturnRows(sqlmock.NewRows([]string{"id", "title", "completed", "created_at", "updated_at"}).AddRow("task-1", "My task", false, createdAt, createdAt))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodPost, "/v1/tasks", strings.NewReader(`{"title":" My task ","userId":"admin-1"}`))
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "user-1", time.Now().Add(time.Minute)))
		request.Header.Set("Content-Type", "application/json")
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusCreated {
			t.Fatalf("got %d, want 201: %s", response.Code, response.Body.String())
		}
		if !strings.Contains(response.Body.String(), `"title":"My task"`) {
			t.Fatalf("task title was not normalized: %s", response.Body.String())
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("task list is scoped to authenticated subject", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		createdAt := time.Date(2026, time.January, 10, 12, 0, 0, 0, time.UTC)
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("user-1", "user@example.test", "User", "user", true, false))
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, title, completed, created_at, updated_at")).
			WithArgs("user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "title", "completed", "created_at", "updated_at"}).AddRow("task-1", "My task", false, createdAt, createdAt))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodGet, "/v1/tasks", nil)
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "user-1", time.Now().Add(time.Minute)))
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), `"id":"task-1"`) {
			t.Fatalf("unexpected task list response %d: %s", response.Code, response.Body.String())
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("task deletion hides another user's task", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("user-1", "user@example.test", "User", "user", true, false))
		mock.ExpectExec(regexp.QuoteMeta("DELETE FROM tasks WHERE id = $1 AND user_id = $2")).
			WithArgs("other-users-task", "user-1").WillReturnResult(sqlmock.NewResult(0, 0))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodDelete, "/v1/tasks/other-users-task", nil)
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "user-1", time.Now().Add(time.Minute)))
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusNotFound {
			t.Fatalf("got %d, want 404: %s", response.Code, response.Body.String())
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
}

func testRouter(db *sql.DB, jwks keyfunc.Keyfunc) *gin.Engine {
	r := gin.New()
	protected := r.Group("/v1", authenticate(db, jwks, testIssuer))
	protected.GET("/me", func(c *gin.Context) { c.JSON(http.StatusOK, c.MustGet("user")) })
	protected.GET("/admin/health", requireAdmin(), func(c *gin.Context) { c.Status(http.StatusOK) })
	protected.GET("/admin/users", requireAdmin(), listAdminUsers(db))
	protected.GET("/tasks", listTasks(db))
	protected.POST("/tasks", createTask(db))
	protected.PATCH("/tasks/:taskId", updateTask(db))
	protected.DELETE("/tasks/:taskId", deleteTask(db))
	return r
}

func signedTestJWT(t *testing.T, privateKey ed25519.PrivateKey, subject string, expires time.Time) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodEdDSA, jwt.MapClaims{
		"sub": subject, "iss": testIssuer, "aud": "saas-api", "iat": time.Now().Unix(), "exp": expires.Unix(),
	})
	signed, err := token.SignedString(privateKey)
	if err != nil {
		t.Fatal(err)
	}
	return signed
}
