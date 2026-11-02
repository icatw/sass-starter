package httpx

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorBody struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	RequestID string `json:"requestId"`
}

func Abort(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, ErrorBody{
		Code:      code,
		Message:   message,
		RequestID: RequestIDFrom(c),
	})
}

func AbortUnauthorized(c *gin.Context, message string) {
	Abort(c, http.StatusUnauthorized, "UNAUTHENTICATED", message)
}

func AbortForbidden(c *gin.Context, code, message string) {
	Abort(c, http.StatusForbidden, code, message)
}

func AbortBadRequest(c *gin.Context, code, message string) {
	Abort(c, http.StatusBadRequest, code, message)
}

func AbortNotFound(c *gin.Context, code, message string) {
	Abort(c, http.StatusNotFound, code, message)
}

func AbortInternal(c *gin.Context, message string) {
	Abort(c, http.StatusInternalServerError, "INTERNAL_ERROR", message)
}

func AbortServiceUnavailable(c *gin.Context, code, message string) {
	Abort(c, http.StatusServiceUnavailable, code, message)
}
