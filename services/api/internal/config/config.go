package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
)

type Env string

const (
	EnvDevelopment Env = "development"
	EnvTest        Env = "test"
	EnvProduction  Env = "production"
)

type Config struct {
	AppEnv      Env
	Port        string
	DatabaseURL string
	IssuerURL   string
}

func Load() (Config, error) {
	appEnv, err := parseAppEnv(os.Getenv("APP_ENV"))
	if err != nil {
		return Config{}, err
	}

	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if databaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}
	if _, err := url.Parse(databaseURL); err != nil {
		return Config{}, fmt.Errorf("DATABASE_URL is invalid: %w", err)
	}

	issuer := strings.TrimSpace(os.Getenv("BETTER_AUTH_URL"))
	if issuer == "" {
		issuer = strings.TrimSpace(os.Getenv("NEXT_PUBLIC_APP_URL"))
	}
	if issuer == "" {
		return Config{}, fmt.Errorf("BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL is required")
	}
	if err := requireAbsoluteHTTPURL("issuer", issuer); err != nil {
		return Config{}, err
	}

	port := strings.TrimSpace(os.Getenv("APP_PORT"))
	if port == "" {
		port = "8080"
	}
	if _, err := strconv.Atoi(port); err != nil {
		return Config{}, fmt.Errorf("APP_PORT must be a number")
	}

	return Config{
		AppEnv:      appEnv,
		Port:        port,
		DatabaseURL: databaseURL,
		IssuerURL:   strings.TrimRight(issuer, "/"),
	}, nil
}

func LoadDatabaseURL() (string, error) {
	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if databaseURL == "" {
		return "", fmt.Errorf("DATABASE_URL is required")
	}
	if _, err := url.Parse(databaseURL); err != nil {
		return "", fmt.Errorf("DATABASE_URL is invalid: %w", err)
	}
	return databaseURL, nil
}

func parseAppEnv(raw string) (Env, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return EnvDevelopment, nil
	}
	switch Env(value) {
	case EnvDevelopment, EnvTest, EnvProduction:
		return Env(value), nil
	default:
		return "", fmt.Errorf("APP_ENV must be one of development, test, production")
	}
}

func requireAbsoluteHTTPURL(name, raw string) error {
	parsed, err := url.Parse(raw)
	if err != nil {
		return fmt.Errorf("%s is invalid: %w", name, err)
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return fmt.Errorf("%s must use http or https", name)
	}
	if parsed.Host == "" {
		return fmt.Errorf("%s must include a host", name)
	}
	return nil
}
