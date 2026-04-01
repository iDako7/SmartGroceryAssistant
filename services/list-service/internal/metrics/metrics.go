package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// HTTP metrics — recorded by the Prometheus middleware.
var (
	HTTPRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "list_service_http_requests_total",
		Help: "Total number of HTTP requests.",
	}, []string{"method", "route", "status"})

	HTTPRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "list_service_http_request_duration_seconds",
		Help:    "HTTP request latency in seconds.",
		Buckets: prometheus.DefBuckets,
	}, []string{"method", "route", "status"})

	HTTPRequestsInFlight = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "list_service_http_requests_in_flight",
		Help: "Number of HTTP requests currently being processed.",
	})
)

// Database metrics — recorded in the repository layer.
var (
	DBQueryDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "list_service_db_query_duration_seconds",
		Help:    "Database query latency in seconds.",
		Buckets: prometheus.DefBuckets,
	}, []string{"operation"})

	DBQueryErrors = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "list_service_db_query_errors_total",
		Help: "Total number of failed database queries.",
	}, []string{"operation"})
)

// Saga metrics — recorded by the user.deleted consumer and cleanup job.
var (
	SagaCleanupTotal = promauto.NewCounter(prometheus.CounterOpts{
		Name: "list_service_saga_cleanup_total",
		Help: "Total user.deleted events processed by the saga consumer.",
	})

	SagaCleanupSections = promauto.NewCounter(prometheus.CounterOpts{
		Name: "list_service_saga_cleanup_sections_total",
		Help: "Total sections soft-deleted by the saga consumer.",
	})

	SagaCleanupItems = promauto.NewCounter(prometheus.CounterOpts{
		Name: "list_service_saga_cleanup_items_total",
		Help: "Total items soft-deleted by the saga consumer.",
	})

	SagaCleanupDuration = promauto.NewHistogram(prometheus.HistogramOpts{
		Name:    "list_service_saga_cleanup_duration_seconds",
		Help:    "Time from receiving user.deleted event to completing cleanup.",
		Buckets: []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
	})

	SagaCleanupErrors = promauto.NewCounter(prometheus.CounterOpts{
		Name: "list_service_saga_cleanup_errors_total",
		Help: "Total errors during saga cleanup processing.",
	})

	OrphanCleanupRunsTotal = promauto.NewCounter(prometheus.CounterOpts{
		Name: "list_service_orphan_cleanup_runs_total",
		Help: "Total periodic orphan cleanup job runs.",
	})

	OrphanCleanupFoundTotal = promauto.NewCounter(prometheus.CounterOpts{
		Name: "list_service_orphan_cleanup_found_total",
		Help: "Total orphaned users found by the periodic cleanup job.",
	})
)

// Connection pool metrics — recorded by a background goroutine in main.
var (
	DBPoolTotalConns = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "list_service_db_pool_total_conns",
		Help: "Total number of connections in the pool.",
	})

	DBPoolIdleConns = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "list_service_db_pool_idle_conns",
		Help: "Number of idle connections in the pool.",
	})

	DBPoolAcquiredConns = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "list_service_db_pool_acquired_conns",
		Help: "Number of connections currently in use.",
	})
)
