package main

import (
	"fmt"
	"os"

	"github.com/icatw/saas-starter/services/api/internal/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}
	fmt.Printf("APP_ENV=%s port=%s issuer=%s", cfg.AppEnv, cfg.Port, cfg.IssuerURL)
}
