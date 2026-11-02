package main

import (
	"context"
	"database/sql"
	"log/slog"
	"os"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/gin-gonic/gin"
	_ "github.com/jackc/pgx/v5/stdlib"
	"golang.org/x/time/rate"

	"github.com/icatw/saas-starter/services/api/internal/app"
	"github.com/icatw/saas-starter/services/api/internal/config"
	"github.com/icatw/saas-starter/services/api/internal/httpx"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}

	db, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		panic(err)
	}
	defer db.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	keyset, err := keyfunc.NewDefaultOverrideCtx(ctx, []string{cfg.IssuerURL + "/api/auth/jwks"}, keyfunc.Override{
		RefreshInterval:   time.Hour,
		RefreshUnknownKID: rate.NewLimiter(rate.Every(5*time.Second), 1),
	})
	if err != nil {
		panic(err)
	}

	r := app.NewRouter(app.Options{
		DB:         db,
		JWKS:       keyset,
		IssuerURL:  cfg.IssuerURL,
		SameOrigin: true,
		Middleware: []gin.HandlerFunc{
			httpx.RequestID(),
			httpx.AccessLog(logger),
			httpx.Recovery(logger),
		},
	})
	if err := r.Run(":" + cfg.Port); err != nil {
		panic(err)
	}
}
