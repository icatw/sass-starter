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

	"github.com/icatw/saas-starter/services/api/internal/app"
	"github.com/icatw/saas-starter/services/api/internal/httpx"
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
		if response.Header().Get(httpx.HeaderRequestID) == "" {
			t.Fatal("expected X-Request-Id response header")
		}
		var body httpx.ErrorBody
		if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
			t.Fatal(err)
		}
		if body.Code != "UNAUTHENTICATED" || body.RequestID == "" {
			t.Fatalf("unexpected error body: %+v", body)
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
	t.Run("regular user cannot update user status", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("user-1", "user@example.test", "User", "user", true, false))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodPatch, "/v1/admin/users/user-2", strings.NewReader(`{"disabled":true}`))
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "user-1", time.Now().Add(time.Minute)))
		request.Header.Set("Content-Type", "application/json")
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusForbidden {
			t.Fatalf("got %d, want 403: %s", response.Code, response.Body.String())
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
	t.Run("task creation rejects overlong title", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("user-1", "user@example.test", "User", "user", true, false))
		r := testRouter(db, keyset)
		overlong := strings.Repeat("测", 201)
		request := httptest.NewRequest(http.MethodPost, "/v1/tasks", strings.NewReader(`{"title":"`+overlong+`"}`))
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "user-1", time.Now().Add(time.Minute)))
		request.Header.Set("Content-Type", "application/json")
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusBadRequest {
			t.Fatalf("got %d, want 400: %s", response.Code, response.Body.String())
		}
		if !strings.Contains(response.Body.String(), "INVALID_TASK") {
			t.Fatalf("expected INVALID_TASK, got %s", response.Body.String())
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("task update rejects missing completion state", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("user-1", "user@example.test", "User", "user", true, false))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodPatch, "/v1/tasks/task-1", strings.NewReader(`{}`))
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "user-1", time.Now().Add(time.Minute)))
		request.Header.Set("Content-Type", "application/json")
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusBadRequest {
			t.Fatalf("got %d, want 400: %s", response.Code, response.Body.String())
		}
		if !strings.Contains(response.Body.String(), "INVALID_TASK") {
			t.Fatalf("expected INVALID_TASK, got %s", response.Body.String())
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("task update rejects non-boolean completion state", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("user-1", "user@example.test", "User", "user", true, false))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodPatch, "/v1/tasks/task-1", strings.NewReader(`{"completed":"yes"}`))
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
	t.Run("admin can disable a user and revoke sessions", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		createdAt := time.Date(2026, time.January, 10, 12, 0, 0, 0, time.UTC)
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("admin-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("admin-1", "admin@example.test", "Admin", "admin", true, false))
		mock.ExpectBegin()
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, name, email, COALESCE(role, 'user'), email_verified,")).
			WithArgs("user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "role", "email_verified", "disabled", "created_at"}).AddRow("user-1", "User", "user@example.test", "user", true, false, createdAt))
		mock.ExpectQuery(regexp.QuoteMeta("UPDATE users")).
			WithArgs(true, "user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "role", "email_verified", "disabled", "created_at"}).AddRow("user-1", "User", "user@example.test", "user", true, true, createdAt))
		mock.ExpectExec(regexp.QuoteMeta("DELETE FROM sessions WHERE user_id = $1")).
			WithArgs("user-1").WillReturnResult(sqlmock.NewResult(0, 2))
		mock.ExpectExec(regexp.QuoteMeta("INSERT INTO audit_logs")).
			WithArgs(sqlmock.AnyArg(), "admin-1", "user.disable", "user", "user-1", sqlmock.AnyArg(), sqlmock.AnyArg()).
			WillReturnResult(sqlmock.NewResult(0, 1))
		mock.ExpectCommit()
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodPatch, "/v1/admin/users/user-1", strings.NewReader(`{"disabled":true}`))
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "admin-1", time.Now().Add(time.Minute)))
		request.Header.Set("Content-Type", "application/json")
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), `"disabled":true`) {
			t.Fatalf("unexpected disable response %d: %s", response.Code, response.Body.String())
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("administrator can list audit logs", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		createdAt := time.Date(2026, time.January, 10, 12, 0, 0, 0, time.UTC)
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("admin-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("admin-1", "admin@example.test", "Admin", "admin", true, false))
		mock.ExpectQuery(regexp.QuoteMeta("SELECT a.id, a.actor_user_id, COALESCE(u.name, ''), COALESCE(u.email, ''),")).
			WillReturnRows(sqlmock.NewRows([]string{"id", "actor_user_id", "actor_name", "actor_email", "action", "resource_type", "resource_id", "metadata", "request_id", "created_at"}).
				AddRow("evt-1", "admin-1", "Admin", "admin@example.test", "user.disable", "user", "user-1", []byte(`{"disabled":true}`), "req-1", createdAt))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodGet, "/v1/admin/audit-logs", nil)
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "admin-1", time.Now().Add(time.Minute)))
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), `"action":"user.disable"`) {
			t.Fatalf("unexpected audit log response %d: %s", response.Code, response.Body.String())
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("regular user cannot list audit logs", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("user-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("user-1", "user@example.test", "User", "user", true, false))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodGet, "/v1/admin/audit-logs", nil)
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
	t.Run("admin cannot disable self", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("admin-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("admin-1", "admin@example.test", "Admin", "admin", true, false))
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodPatch, "/v1/admin/users/admin-1", strings.NewReader(`{"disabled":true}`))
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "admin-1", time.Now().Add(time.Minute)))
		request.Header.Set("Content-Type", "application/json")
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusForbidden {
			t.Fatalf("got %d, want 403: %s", response.Code, response.Body.String())
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("cannot disable the last active admin", func(t *testing.T) {
		db, mock, _ := sqlmock.New()
		defer db.Close()
		createdAt := time.Date(2026, time.January, 10, 12, 0, 0, 0, time.UTC)
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1")).
			WithArgs("admin-1").WillReturnRows(sqlmock.NewRows([]string{"id", "email", "name", "role", "email_verified", "disabled"}).AddRow("admin-1", "admin@example.test", "Admin", "admin", true, false))
		mock.ExpectBegin()
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, name, email, COALESCE(role, 'user'), email_verified,")).
			WithArgs("admin-2").WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "role", "email_verified", "disabled", "created_at"}).AddRow("admin-2", "Other Admin", "admin2@example.test", "admin", true, false, createdAt))
		mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(*) FROM users")).
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
		mock.ExpectRollback()
		r := testRouter(db, keyset)
		request := httptest.NewRequest(http.MethodPatch, "/v1/admin/users/admin-2", strings.NewReader(`{"disabled":true}`))
		request.Header.Set("Authorization", "Bearer "+signedTestJWT(t, privateKey, "admin-1", time.Now().Add(time.Minute)))
		request.Header.Set("Content-Type", "application/json")
		response := httptest.NewRecorder()
		r.ServeHTTP(response, request)
		if response.Code != http.StatusConflict || !strings.Contains(response.Body.String(), "LAST_ADMIN") {
			t.Fatalf("got %d, want 409 LAST_ADMIN: %s", response.Code, response.Body.String())
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatal(err)
		}
	})
}

func testRouter(db *sql.DB, jwks keyfunc.Keyfunc) *gin.Engine {
	return app.NewRouter(app.Options{
		DB:        db,
		JWKS:      jwks,
		IssuerURL: testIssuer,
		Middleware: []gin.HandlerFunc{
			httpx.RequestID(),
		},
	})
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
