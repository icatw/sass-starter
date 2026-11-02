package httpx

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
}

type ReadyResponse struct {
	Status  string            `json:"status"`
	Service string            `json:"service"`
	Checks  map[string]string `json:"checks"`
}

func Liveness() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, HealthResponse{Status: "ok", Service: "api"})
	}
}

func Readiness(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		if err := db.PingContext(ctx); err != nil {
			AbortServiceUnavailable(c, "DEPENDENCY_UNAVAILABLE", "Database is unavailable")
			return
		}
		c.JSON(http.StatusOK, ReadyResponse{
			Status:  "ok",
			Service: "api",
			Checks: map[string]string{
				"database": "ok",
			},
		})
	}
}
