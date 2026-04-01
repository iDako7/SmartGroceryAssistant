package middleware

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/iDako7/SmartGroceryAssistant/services/list-service/internal/metrics"
)

// Metrics returns a Gin middleware that records Prometheus HTTP metrics.
func Metrics() gin.HandlerFunc {
	return func(c *gin.Context) {
		metrics.HTTPRequestsInFlight.Inc()
		defer metrics.HTTPRequestsInFlight.Dec()

		start := time.Now()

		c.Next()

		route := c.FullPath()
		if route == "" {
			route = "unknown"
		}
		status := strconv.Itoa(c.Writer.Status())
		method := c.Request.Method
		elapsed := time.Since(start).Seconds()

		metrics.HTTPRequestsTotal.WithLabelValues(method, route, status).Inc()
		metrics.HTTPRequestDuration.WithLabelValues(method, route, status).Observe(elapsed)
	}
}
