# User Service Load Test

## Workload Model

The load test simulates realistic traffic patterns for a grocery app's user service.

### User Types

| Class | Weight | Think Time | Description |
|---|---|---|---|
| `ReturningUser` | 9 (90%) | 2–5s | Existing user: logs in, reads/updates profile |
| `NewUser` | 1 (10%) | 3–8s | New signup: registers then views profile |

### Request Mix

| Endpoint | Method | ~% of Traffic | Rationale |
|---|---|---|---|
| `/api/v1/users/me` | GET | 60% | Profile reads dominate (settings page, nav bar) |
| `/api/v1/users/login` | POST | 15% | Session starts + token refreshes |
| `/api/v1/users/me` | PUT | 15% | Occasional preference updates |
| `/api/v1/users/register` | POST | 5% | New signups (rare vs returning users) |
| `/health` | GET | 5% | Infrastructure health probes |

### Task Weights (ReturningUser)

| Task | Weight | Per ~19 actions |
|---|---|---|
| `get_profile` | 12 | 12 |
| `update_profile` | 3 | 3 |
| `login` | 3 | 3 |
| `health_check` | 1 | 1 |

## Running the Load Test

### Prerequisites

Start the main stack first:

```bash
docker compose up -d
```

### With Docker (master + workers)

```bash
cd services/user-service/locust

# Start master + 3 workers
docker compose up -d --build

# Scale workers
LOCUST_WORKERS=5 docker compose up -d --scale locust-worker=5
```

Open http://localhost:8089 for the Locust web UI.

### Headless (CLI)

```bash
cd services/user-service/locust

# Baseline: 100 users, ramp 10/sec, 2 min
docker compose run --rm locust-master \
  --master --headless \
  --host=http://user-service:4001 \
  -u 100 -r 10 --run-time 2m

# Or locally with uv
uv sync
uv run locust -f locustfile.py --host http://localhost:4001 \
  --headless -u 100 -r 10 --run-time 2m \
  --csv results/baseline --html results/baseline.html
```

### Suggested Test Tiers

| Tier | Users | Ramp Rate | Duration | Purpose |
|---|---|---|---|---|
| Baseline | 100 | 10/s | 2m | Normal operating conditions |
| Moderate | 500 | 25/s | 5m | Peak traffic simulation |
| Stress | 1000+ | 50/s | 5m | Find breaking point |

## Baseline Results (1 user)

| Endpoint | Median | p95 | p99 | # Requests | # Fails |
|---|---|---|---|---|---|
| `GET /api/v1/users/me` | 17ms | 41ms | 78ms | 219 | 0 |
| `PUT /api/v1/users/me` | 21ms | 37ms | 220ms | 60 | 0 |
| `POST /api/v1/users/login` | 89ms | 110ms | 310ms | 58 | 0 |
| `GET /health` | 8ms | 25ms | 25ms | 15 | 0 |
| **Aggregated** | **21ms** | **97ms** | **220ms** | **353** | **0** |

### Key Observations

- **Login is the slowest** (89ms median) — bcrypt password hashing is CPU-intensive
- **Profile reads are fast** (17ms median) — simple DB lookup
- **Zero failures** at low load — service is stable

## Grafana Monitoring

Grafana is available at http://localhost:3333 (admin/admin). Key queries to monitor during load tests:

| Panel | PromQL |
|---|---|
| RPS by route | `sum(rate(user_service_http_requests_total[1m])) by (route)` |
| Latency p95 | `histogram_quantile(0.95, sum(rate(user_service_http_request_duration_seconds_bucket[1m])) by (le, route))` |
| Error rate | `sum(rate(user_service_http_requests_total{status=~"5.."}[1m])) by (route)` |
| In-flight requests | `user_service_http_requests_in_flight` |
| DB query p95 | `histogram_quantile(0.95, sum(rate(user_service_db_query_duration_seconds_bucket[1m])) by (le, operation))` |
| DB errors | `sum(rate(user_service_db_query_errors_total[1m])) by (operation)` |
| Connection pool | `user_service_db_pool_total_conns` / `*_idle_conns` / `*_acquired_conns` |
