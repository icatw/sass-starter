package httpx

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRequestIDReuseAndReject(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(RequestID())
	r.GET("/ping", func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	req := httptest.NewRequest(http.MethodGet, "/ping", nil)
	req.Header.Set(HeaderRequestID, "req-abc_123")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if got := rec.Header().Get(HeaderRequestID); got != "req-abc_123" {
		t.Fatalf("got %q, want reused request id", got)
	}

	bad := httptest.NewRequest(http.MethodGet, "/ping", nil)
	bad.Header.Set(HeaderRequestID, "bad id with spaces")
	badRec := httptest.NewRecorder()
	r.ServeHTTP(badRec, bad)
	if got := badRec.Header().Get(HeaderRequestID); got == "" || got == "bad id with spaces" {
		t.Fatalf("expected generated request id, got %q", got)
	}
}

func TestAbortIncludesRequestID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(RequestID())
	r.GET("/err", func(c *gin.Context) {
		AbortUnauthorized(c, "Authentication required")
	})

	req := httptest.NewRequest(http.MethodGet, "/err", nil)
	req.Header.Set(HeaderRequestID, "fixed-request-id")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("got %d, want 401", rec.Code)
	}
	var body ErrorBody
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.Code != "UNAUTHENTICATED" || body.RequestID != "fixed-request-id" {
		t.Fatalf("unexpected body: %+v", body)
	}
}

func TestAccessLogOmitsAuthorization(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil))
	r := gin.New()
	r.Use(RequestID(), AccessLog(logger))
	r.GET("/ok", func(c *gin.Context) { c.Status(http.StatusNoContent) })

	req := httptest.NewRequest(http.MethodGet, "/ok", nil)
	req.Header.Set("Authorization", "Bearer super-secret-token")
	req.Header.Set(HeaderRequestID, "log-request-id")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	output := buf.String()
	if !strings.Contains(output, "log-request-id") {
		t.Fatalf("expected request id in logs, got %s", output)
	}
	if strings.Contains(output, "super-secret-token") || strings.Contains(strings.ToLower(output), "authorization") {
		t.Fatalf("authorization leaked into logs: %s", output)
	}
}
