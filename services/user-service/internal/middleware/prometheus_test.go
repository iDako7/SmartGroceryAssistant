package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/iDako7/SmartGroceryAssistant/services/user-service/internal/middleware"
	"github.com/prometheus/client_golang/prometheus"
	dto "github.com/prometheus/client_model/go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// gather collects all metric families from the default registry.
func gather(t *testing.T) map[string]*dto.MetricFamily {
	t.Helper()
	families, err := prometheus.DefaultGatherer.Gather()
	require.NoError(t, err)
	m := make(map[string]*dto.MetricFamily, len(families))
	for _, f := range families {
		m[f.GetName()] = f
	}
	return m
}

// findCounter returns the counter value for the given label set, or -1 if not found.
func findCounter(family *dto.MetricFamily, labels map[string]string) float64 {
	for _, m := range family.GetMetric() {
		if matchLabels(m, labels) {
			return m.GetCounter().GetValue()
		}
	}
	return -1
}

// findHistogramCount returns the sample count for the given label set.
func findHistogramCount(family *dto.MetricFamily, labels map[string]string) uint64 {
	for _, m := range family.GetMetric() {
		if matchLabels(m, labels) {
			return m.GetHistogram().GetSampleCount()
		}
	}
	return 0
}

func matchLabels(m *dto.Metric, want map[string]string) bool {
	have := make(map[string]string)
	for _, lp := range m.GetLabel() {
		have[lp.GetName()] = lp.GetValue()
	}
	for k, v := range want {
		if have[k] != v {
			return false
		}
	}
	return true
}

func newMetricsRouter() *gin.Engine {
	r := gin.New()
	r.Use(middleware.Metrics())
	r.GET("/api/v1/users/me", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	r.POST("/api/v1/users/login", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	return r
}

func TestMetrics_IncrementsRequestCounter(t *testing.T) {
	r := newMetricsRouter()

	// Record baseline
	baselineFamilies := gather(t)
	var baseline float64
	if f, ok := baselineFamilies["user_service_http_requests_total"]; ok {
		baseline = findCounter(f, map[string]string{"method": "GET", "route": "/api/v1/users/me", "status": "200"})
		if baseline == -1 {
			baseline = 0
		}
	}

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/users/me", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	families := gather(t)
	f, ok := families["user_service_http_requests_total"]
	require.True(t, ok, "metric user_service_http_requests_total should exist")

	val := findCounter(f, map[string]string{"method": "GET", "route": "/api/v1/users/me", "status": "200"})
	assert.Equal(t, baseline+1, val)
}

func TestMetrics_RecordsRequestDuration(t *testing.T) {
	r := newMetricsRouter()

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/users/login", nil)
	r.ServeHTTP(w, req)

	families := gather(t)
	f, ok := families["user_service_http_request_duration_seconds"]
	require.True(t, ok, "metric user_service_http_request_duration_seconds should exist")

	count := findHistogramCount(f, map[string]string{"method": "POST", "route": "/api/v1/users/login", "status": "200"})
	assert.GreaterOrEqual(t, count, uint64(1))
}

func TestMetrics_UnmatchedRoute_UsesUnknown(t *testing.T) {
	r := newMetricsRouter()

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/nonexistent/path", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusNotFound, w.Code)

	families := gather(t)
	f, ok := families["user_service_http_requests_total"]
	require.True(t, ok)

	val := findCounter(f, map[string]string{"method": "GET", "route": "unknown", "status": "404"})
	assert.GreaterOrEqual(t, val, float64(1))
}
