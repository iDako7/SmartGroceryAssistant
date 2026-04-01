package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// HTTP metrics — recorded by the Prometheus middleware.
var (
	HTTPRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "user_service_http_requests_total",
		Help: "Total number of HTTP requests.",
	}, []string{"method", "route", "status"})

	HTTPRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "user_service_http_request_duration_seconds",
		Help:    "HTTP request latency in seconds.",
		Buckets: prometheus.DefBuckets,
	}, []string{"method", "route", "status"})

	HTTPRequestsInFlight = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "user_service_http_requests_in_flight",
		Help: "Number of HTTP requests currently being processed.",
	})
)

// Database metrics — recorded in the repository layer.
var (
	DBQueryDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "user_service_db_query_duration_seconds",
		Help:    "Database query latency in seconds.",
		Buckets: prometheus.DefBuckets,
	}, []string{"operation"})

	DBQueryErrors = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "user_service_db_query_errors_total",
		Help: "Total number of failed database queries.",
	}, []string{"operation"})
)

// User lifecycle metrics — recorded in the service layer.
var (
	UsersDeletedTotal = promauto.NewCounter(prometheus.CounterOpts{
		Name: "user_service_users_deleted_total",
		Help: "Total number of users deleted.",
	})

	UserDeletedEventPublished = promauto.NewCounter(prometheus.CounterOpts{
		Name: "user_service_user_deleted_event_published_total",
		Help: "Total user.deleted events successfully published to RabbitMQ.",
	})

	UserDeletedEventFailed = promauto.NewCounter(prometheus.CounterOpts{
		Name: "user_service_user_deleted_event_failed_total",
		Help: "Total user.deleted events that failed to publish.",
	})
)

// Connection pool metrics — recorded by a background goroutine in main.
var (
	DBPoolTotalConns = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "user_service_db_pool_total_conns",
		Help: "Total number of connections in the pool.",
	})

	DBPoolIdleConns = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "user_service_db_pool_idle_conns",
		Help: "Number of idle connections in the pool.",
	})

	DBPoolAcquiredConns = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "user_service_db_pool_acquired_conns",
		Help: "Number of connections currently in use.",
	})
)
