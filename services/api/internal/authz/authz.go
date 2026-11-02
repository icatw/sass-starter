package authz

import (
	"database/sql"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"github.com/icatw/saas-starter/services/api/internal/httpx"
)

const userContextKey = "authz.user"

// User is the authenticated account loaded from the database.
type User struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}

// Authenticate validates the internal JWT and loads the current user from PostgreSQL.
func Authenticate(db *sql.DB, jwks keyfunc.Keyfunc, issuer string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
			httpx.AbortUnauthorized(c, "Authentication required")
			return
		}
		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(parts[1], claims, jwks.Keyfunc,
			jwt.WithValidMethods([]string{jwt.SigningMethodEdDSA.Alg()}),
			jwt.WithIssuer(issuer), jwt.WithAudience("saas-api"), jwt.WithExpirationRequired(),
			jwt.WithLeeway(5*time.Second))
		if err != nil || token == nil || !token.Valid || claims["sub"] == nil {
			httpx.AbortUnauthorized(c, "Invalid or expired credential")
			return
		}
		sub, ok := claims["sub"].(string)
		if !ok || sub == "" {
			httpx.AbortUnauthorized(c, "Invalid subject")
			return
		}
		var current User
		var verified, disabled bool
		err = db.QueryRowContext(c.Request.Context(), `SELECT id, email, name, role, email_verified, disabled FROM users WHERE id = $1`, sub).
			Scan(&current.ID, &current.Email, &current.Name, &current.Role, &verified, &disabled)
		if errors.Is(err, sql.ErrNoRows) || (err == nil && (!verified || disabled)) {
			httpx.AbortUnauthorized(c, "Account is unavailable")
			return
		}
		if err != nil {
			httpx.AbortInternal(c, "Unable to load account")
			return
		}
		c.Set(userContextKey, current)
		c.Next()
	}
}

// RequireAdmin rejects authenticated non-admin users.
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		if CurrentUser(c).Role != "admin" {
			httpx.AbortForbidden(c, "FORBIDDEN", "Administrator access required")
			return
		}
		c.Next()
	}
}

// RequireSameOrigin rejects mutating requests whose Origin does not match the configured issuer.
func RequireSameOrigin(allowed string) gin.HandlerFunc {
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
				httpx.AbortForbidden(c, "INVALID_ORIGIN", "Request origin is not allowed")
				return
			}
		}
		c.Next()
	}
}

// CurrentUser returns the authenticated user stored by Authenticate.
func CurrentUser(c *gin.Context) User {
	return c.MustGet(userContextKey).(User)
}

// CurrentUserID returns the authenticated subject id.
func CurrentUserID(c *gin.Context) string {
	return CurrentUser(c).ID
}
