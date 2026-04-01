# List Service Load Tests — Experiments 2a & 2b

## Prerequisites

1. Docker Compose stack running:
   ```bash
   docker compose up -d postgres rabbitmq user-service list-service prometheus grafana
   ```

2. Install Python dependencies:
   ```bash
   pip install locust PyJWT "psycopg[binary]"
   ```
   Or use the Dockerfile for containerized runs.

## Experiment 2a: Concurrent Write Serialization

Tests whether concurrent writers to the same list section cause lost updates,
duplicate items, or phantom entries.

```bash
cd services/list-service/locust

# 1 writer (baseline)
locust -f locustfile_2a.py --host http://localhost:4002 \
  --headless -u 1 -r 1 --run-time 60s \
  --csv results/2a_1writer --html results/2a_1writer.html

# 5 concurrent writers
locust -f locustfile_2a.py --host http://localhost:4002 \
  --headless -u 5 -r 5 --run-time 60s \
  --csv results/2a_5writers --html results/2a_5writers.html

# 10 concurrent writers
locust -f locustfile_2a.py --host http://localhost:4002 \
  --headless -u 10 -r 10 --run-time 60s \
  --csv results/2a_10writers --html results/2a_10writers.html

# Verify data integrity after each run
python verify_2a.py --ops-log results/2a_ops_log.json
```

**Important:** The verification script must be run immediately after each Locust
run, before starting the next one (or reset the DB between runs).

## Experiment 2b: Cross-Database Ownership Enforcement

Tests whether ownership checks hold under load with a mix of legitimate (80%)
and unauthorized (20%) requests across 5 users.

```bash
cd services/list-service/locust

# 1 concurrent user
locust -f locustfile_2b.py --host http://localhost:4002 \
  --headless -u 1 -r 1 --run-time 60s \
  --csv results/2b_1user --html results/2b_1user.html

# 5 concurrent users
locust -f locustfile_2b.py --host http://localhost:4002 \
  --headless -u 5 -r 5 --run-time 60s \
  --csv results/2b_5users --html results/2b_5users.html

# 10 concurrent users
locust -f locustfile_2b.py --host http://localhost:4002 \
  --headless -u 10 -r 10 --run-time 60s \
  --csv results/2b_10users --html results/2b_10users.html

# Verify ownership enforcement
python verify_2b.py --ops-log results/2b_ops_log.json
```

## Resetting Between Runs

To get clean results, truncate the test data between experiments:

```sql
-- Connect to list_db
psql postgres://sga:sga_secret@localhost:5432/list_db

-- Clear all test data
TRUNCATE items CASCADE;
TRUNCATE sections CASCADE;
```

## Observability

While tests are running, check:

- **Grafana** at http://localhost:3333 — list service dashboard
- **Prometheus** at http://localhost:9090 — query `list_service_http_request_duration_seconds` and `list_service_db_query_duration_seconds`
