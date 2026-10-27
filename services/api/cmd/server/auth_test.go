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
}

func testRouter(db *sql.DB, jwks keyfunc.Keyfunc) *gin.Engine {
	r := gin.New()
	protected := r.Group("/v1", authenticate(db, jwks, testIssuer))
	protected.GET("/me", func(c *gin.Context) { c.JSON(http.StatusOK, c.MustGet("user")) })
	protected.GET("/admin/health", requireAdmin(), func(c *gin.Context) { c.Status(http.StatusOK) })
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
