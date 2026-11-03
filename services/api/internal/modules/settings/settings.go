package settings

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Snapshot is the non-secret runtime configuration exposed to administrators.
type Snapshot struct {
	AppEnv             string `json:"appEnv"`
	APIPort            string `json:"apiPort"`
	IssuerURL          string `json:"issuerURL"`
	Audience           string `json:"audience"`
	DatabaseConfigured bool   `json:"databaseConfigured"`
}

func Get(snapshot Snapshot) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"settings": snapshot})
	}
}
