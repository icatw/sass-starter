package config

import "testing"

func TestLoadRequiresDatabaseAndIssuer(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("BETTER_AUTH_URL", "")
	t.Setenv("NEXT_PUBLIC_APP_URL", "")
	t.Setenv("APP_PORT", "")

	if _, err := Load(); err == nil {
		t.Fatal("expected missing database/issuer to fail")
	}

	t.Setenv("DATABASE_URL", "postgres://saas:saas@localhost:5432/saas?sslmode=disable")
	t.Setenv("BETTER_AUTH_URL", "http://localhost:3000")
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() unexpected error: %v", err)
	}
	if cfg.Port != "8080" {
		t.Fatalf("expected default port 8080, got %q", cfg.Port)
	}
	if cfg.IssuerURL != "http://localhost:3000" {
		t.Fatalf("unexpected issuer %q", cfg.IssuerURL)
	}
}

func TestLoadRejectsInvalidAppEnvAndPort(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://saas:saas@localhost:5432/saas?sslmode=disable")
	t.Setenv("BETTER_AUTH_URL", "http://localhost:3000")
	t.Setenv("APP_ENV", "staging")
	if _, err := Load(); err == nil {
		t.Fatal("expected invalid APP_ENV to fail")
	}

	t.Setenv("APP_ENV", "test")
	t.Setenv("APP_PORT", "abc")
	if _, err := Load(); err == nil {
		t.Fatal("expected invalid APP_PORT to fail")
	}
}
