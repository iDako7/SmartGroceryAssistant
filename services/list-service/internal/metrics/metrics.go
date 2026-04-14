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

// Saga metrics — recorded by the event consumer.
var (
	SagaEventsConsumed = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "list_service_saga_events_consumed_total",
		Help: "Total saga events consumed from RabbitMQ.",
	}, []string{"event_type", "status"})

	SagaCleanupDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "list_service_saga_cleanup_duration_seconds",
		Help:    "Time to clean up user data on saga event.",
		Buckets: []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1},
	}, []string{"event_type"})

	SagaSectionsDeleted = promauto.NewCounter(prometheus.CounterOpts{
		Name: "list_service_saga_sections_deleted_total",
		Help: "Total sections soft-deleted by saga cleanup.",
	})

	SagaItemsDeleted = promauto.NewCounter(prometheus.CounterOpts{
		Name: "list_service_saga_items_deleted_total",
		Help: "Total items soft-deleted by saga cleanup.",
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
