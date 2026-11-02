package app

import (
	"database/sql"
	"net/http"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/gin-gonic/gin"

	"github.com/icatw/saas-starter/services/api/internal/authz"
	"github.com/icatw/saas-starter/services/api/internal/httpx"
	"github.com/icatw/saas-starter/services/api/internal/modules/adminusers"
	"github.com/icatw/saas-starter/services/api/internal/modules/tasks"
)

// Options configure route registration for the API server and tests.
type Options struct {
	DB         *sql.DB
	JWKS       keyfunc.Keyfunc
	IssuerURL  string
	SameOrigin bool
	Middleware []gin.HandlerFunc
}

// NewRouter builds the Gin engine with shared middleware and /v1 routes.
func NewRouter(opts Options) *gin.Engine {
	r := gin.New()
	for _, middleware := range opts.Middleware {
		r.Use(middleware)
	}
	if opts.SameOrigin {
		r.Use(authz.RequireSameOrigin(opts.IssuerURL))
	}

	r.GET("/healthz", httpx.Liveness())
	r.GET("/readyz", httpx.Readiness(opts.DB))

	protected := r.Group("/v1", authz.Authenticate(opts.DB, opts.JWKS, opts.IssuerURL))
	protected.GET("/me", func(c *gin.Context) {
		c.JSON(http.StatusOK, authz.CurrentUser(c))
	})
	protected.GET("/admin/health", authz.RequireAdmin(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	protected.GET("/admin/users", authz.RequireAdmin(), adminusers.List(opts.DB))
	protected.PATCH("/admin/users/:userId", authz.RequireAdmin(), adminusers.UpdateStatus(opts.DB))
	protected.GET("/tasks", tasks.List(opts.DB))
	protected.POST("/tasks", tasks.Create(opts.DB))
	protected.PATCH("/tasks/:taskId", tasks.Update(opts.DB))
	protected.DELETE("/tasks/:taskId", tasks.Delete(opts.DB))
	return r
}
