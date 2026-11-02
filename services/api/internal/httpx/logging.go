package httpx

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func AccessLog(logger *slog.Logger) gin.HandlerFunc {
	if logger == nil {
		logger = slog.Default()
	}
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		logger.Info("request",
			"requestId", RequestIDFrom(c),
			"method", c.Request.Method,
			"path", preferRoute(c),
			"status", c.Writer.Status(),
			"latency_ms", time.Since(start).Milliseconds(),
			"bytes", c.Writer.Size(),
			"client_ip", c.ClientIP(),
		)
	}
}

func Recovery(logger *slog.Logger) gin.HandlerFunc {
	if logger == nil {
		logger = slog.Default()
	}
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		logger.Error("panic",
			"requestId", RequestIDFrom(c),
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"error", recovered,
		)
		if !c.Writer.Written() {
			Abort(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error")
		}
	})
}

func preferRoute(c *gin.Context) string {
	if route := c.FullPath(); route != "" {
		return route
	}
	return c.Request.URL.Path
}
