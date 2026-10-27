package main

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	_ "github.com/jackc/pgx/v5/stdlib"
	"golang.org/x/time/rate"
)

type user struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}

func authenticate(db *sql.DB, jwks keyfunc.Keyfunc, issuer string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"code": "UNAUTHENTICATED", "message": "Authentication required"})
			return
		}
		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(parts[1], claims, jwks.Keyfunc,
			jwt.WithValidMethods([]string{jwt.SigningMethodEdDSA.Alg()}),
			jwt.WithIssuer(issuer), jwt.WithAudience("saas-api"), jwt.WithExpirationRequired(),
			jwt.WithLeeway(5*time.Second))
		if err != nil || token == nil || !token.Valid || claims["sub"] == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"code": "UNAUTHENTICATED", "message": "Invalid or expired credential"})
			return
		}
		sub, ok := claims["sub"].(string)
		if !ok || sub == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"code": "UNAUTHENTICATED", "message": "Invalid subject"})
			return
		}
		var current user
		var verified, disabled bool
		err = db.QueryRowContext(c.Request.Context(), `SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1`, sub).
			Scan(&current.ID, &current.Email, &current.Name, &current.Role, &verified, &disabled)
		if errors.Is(err, sql.ErrNoRows) || (err == nil && (!verified || disabled)) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"code": "UNAUTHENTICATED", "message": "Account is unavailable"})
			return
		}
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_ERROR", "message": "Unable to load account"})
			return
		}
		c.Set("user", current)
		c.Next()
	}
}

func requireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		current := c.MustGet("user").(user)
		if current.Role != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"code": "FORBIDDEN", "message": "Administrator access required"})
			return
		}
		c.Next()
	}
}

func requireSameOrigin(allowed string) gin.HandlerFunc {
	allowedURL, err := url.Parse(allowed)
	if err != nil || allowedURL.Scheme == "" || allowedURL.Host == "" {
		panic("authentication issuer must be an absolute URL")
	}
	allowedOrigin := allowedURL.Scheme + "://" + allowedURL.Host
	return func(c *gin.Context) {
		switch c.Request.Method {
		case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
			origin, err := url.Parse(c.GetHeader("Origin"))
			if err != nil || origin.Scheme+"://"+origin.Host != allowedOrigin {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"code": "INVALID_ORIGIN", "message": "Request origin is not allowed"})
				return
			}
		}
		c.Next()
	}
}

func main() {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	databaseURL := os.Getenv("DATABASE_URL")
	issuer := os.Getenv("BETTER_AUTH_URL")
	if issuer == "" {
		issuer = os.Getenv("NEXT_PUBLIC_APP_URL")
	}
	if databaseURL == "" || issuer == "" {
		panic("DATABASE_URL and BETTER_AUTH_URL (or NEXT_PUBLIC_APP_URL) are required")
	}
	r.Use(requireSameOrigin(issuer))
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		panic(err)
	}
	defer db.Close()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	keyset, err := keyfunc.NewDefaultOverrideCtx(ctx, []string{strings.TrimRight(issuer, "/") + "/api/auth/jwks"}, keyfunc.Override{
		RefreshInterval:   time.Hour,
		RefreshUnknownKID: rate.NewLimiter(rate.Every(5*time.Second), 1),
	})
	if err != nil {
		panic(err)
	}

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "api",
		})
	})
	protected := r.Group("/v1", authenticate(db, keyset, issuer))
	protected.GET("/me", func(c *gin.Context) { c.JSON(http.StatusOK, c.MustGet("user")) })
	protected.GET("/admin/health", requireAdmin(), func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	if err := r.Run(":" + port); err != nil {
		panic(err)
	}
}
