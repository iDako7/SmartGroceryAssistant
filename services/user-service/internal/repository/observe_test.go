package repository

import (
	"errors"
	"testing"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	dto "github.com/prometheus/client_model/go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

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

func findHistogramCount(family *dto.MetricFamily, operation string) uint64 {
	for _, m := range family.GetMetric() {
		for _, lp := range m.GetLabel() {
			if lp.GetName() == "operation" && lp.GetValue() == operation {
				return m.GetHistogram().GetSampleCount()
			}
		}
	}
	return 0
}

func findCounter(family *dto.MetricFamily, operation string) float64 {
	for _, m := range family.GetMetric() {
		for _, lp := range m.GetLabel() {
			if lp.GetName() == "operation" && lp.GetValue() == operation {
				return m.GetCounter().GetValue()
			}
		}
	}
	return -1
}

func TestObserveQuery_RecordsDuration(t *testing.T) {
	start := time.Now().Add(-50 * time.Millisecond) // simulate 50ms query
	observeQuery("test_duration_op", start, nil)

	families := gather(t)
	f, ok := families["user_service_db_query_duration_seconds"]
	require.True(t, ok)

	count := findHistogramCount(f, "test_duration_op")
	assert.GreaterOrEqual(t, count, uint64(1))
}

func TestObserveQuery_IncrementsErrorCounter(t *testing.T) {
	start := time.Now()
	observeQuery("test_error_op", start, errors.New("db failure"))

	families := gather(t)

	// Duration should still be recorded on error
	df, ok := families["user_service_db_query_duration_seconds"]
	require.True(t, ok)
	assert.GreaterOrEqual(t, findHistogramCount(df, "test_error_op"), uint64(1))

	// Error counter should be incremented
	ef, ok := families["user_service_db_query_errors_total"]
	require.True(t, ok)
	assert.GreaterOrEqual(t, findCounter(ef, "test_error_op"), float64(1))
}

func TestObserveQuery_NoErrorCounter_OnSuccess(t *testing.T) {
	start := time.Now()
	observeQuery("test_success_op", start, nil)

	families := gather(t)

	// Error counter should not exist for this operation (or be 0)
	if ef, ok := families["user_service_db_query_errors_total"]; ok {
		val := findCounter(ef, "test_success_op")
		assert.True(t, val == -1 || val == 0, "error counter should be 0 on success")
	}
}
