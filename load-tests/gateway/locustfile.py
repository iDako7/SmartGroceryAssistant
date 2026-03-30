"""
API Gateway load test — measures end-to-end latency through the Gateway
to each downstream service under varying concurrency levels.

Usage:
    # Install locust
    pip install locust

    # Run with web UI (interactive)
    locust -f load-tests/gateway/locustfile.py --host http://localhost:3001

    # Run headless (for CI / automated experiments)
    locust -f load-tests/gateway/locustfile.py --host http://localhost:3001 \
        --headless -u 20 -r 5 -t 60s --csv load-tests/gateway/results

Experiment plan:
    1. Baseline: 1 user, 30s — measure p50/p95/p99 latency per route
    2. Light load: 5 users, 60s — check if latency remains stable
    3. Medium load: 20 users, 60s — find degradation point
    4. Stress: 50 users, 60s — find breaking point

Prerequisites:
    - docker compose up -d (postgres, redis, rabbitmq)
    - API Gateway running on :3001
    - User Service running on :4001
    - List Service running on :4002
    - (AI Service on :4003 optional — tests will still record error latency)
"""

import json
import time

from locust import HttpUser, between, task, tag


class GatewayUser(HttpUser):
    """Simulates a typical user flow through the API Gateway."""

    wait_time = between(0.5, 2)

    def on_start(self):
        """Register and login to get a JWT token."""
        email = f"loadtest-{time.time_ns()}@test.com"
        password = "testpassword123"

        # Register
        with self.client.post(
            "/api/v1/users/register",
            json={"email": email, "password": password},
            catch_response=True,
        ) as resp:
            if resp.status_code in (201, 200):
                data = resp.json()
                self.token = data.get("token", "")
                self.headers = {"Authorization": f"Bearer {self.token}"}
                resp.success()
            else:
                # If registration fails (e.g., service down), mark and continue
                self.token = ""
                self.headers = {}
                resp.failure(f"Register failed: {resp.status_code}")

    @tag("health")
    @task(1)
    def health_check(self):
        """GET /health — baseline Gateway latency (no upstream)."""
        self.client.get("/health", name="/health")

    @tag("auth")
    @task(2)
    def get_profile(self):
        """GET /api/v1/users/me — measures Gateway → User Service latency."""
        if not self.token:
            return
        self.client.get(
            "/api/v1/users/me",
            headers=self.headers,
            name="/api/v1/users/me",
        )

    @tag("auth")
    @task(1)
    def update_profile(self):
        """PUT /api/v1/users/me — measures Gateway → User Service write latency."""
        if not self.token:
            return
        self.client.put(
            "/api/v1/users/me",
            headers=self.headers,
            json={
                "language_preference": "en",
                "dietary_restrictions": ["Vegetarian"],
                "household_size": 2,
                "taste_preferences": "Spicy, Savory",
            },
            name="/api/v1/users/me",
        )

    @tag("lists")
    @task(3)
    def get_full_list(self):
        """GET /api/v1/lists/full — measures Gateway → List Service latency."""
        if not self.token:
            return
        self.client.get(
            "/api/v1/lists/full",
            headers=self.headers,
            name="/api/v1/lists/full",
        )

    @tag("lists")
    @task(2)
    def create_and_delete_section(self):
        """POST + DELETE section — measures write path latency."""
        if not self.token:
            return
        # Create
        with self.client.post(
            "/api/v1/lists/sections",
            headers=self.headers,
            json={"name": f"LoadTest-{time.time_ns()}", "position": 0},
            name="/api/v1/lists/sections [POST]",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201):
                section_id = resp.json().get("id")
                resp.success()
                if section_id:
                    # Delete
                    self.client.delete(
                        f"/api/v1/lists/sections/{section_id}",
                        headers=self.headers,
                        name="/api/v1/lists/sections/:id [DELETE]",
                    )
            else:
                resp.failure(f"Create section failed: {resp.status_code}")

    @tag("ai")
    @task(1)
    def ai_item_info(self):
        """POST /api/v1/ai/item-info — measures Gateway → AI Service latency."""
        if not self.token:
            return
        self.client.post(
            "/api/v1/ai/item-info",
            headers=self.headers,
            json={"name_en": "Milk"},
            name="/api/v1/ai/item-info",
        )

    @tag("rate-limit")
    @task(1)
    def rapid_requests(self):
        """Burst 5 rapid health checks to test rate limiting behavior."""
        for _ in range(5):
            self.client.get("/health", name="/health [burst]")


class GatewayHealthOnly(HttpUser):
    """Lightweight user that only hits /health — for pure Gateway throughput testing."""

    wait_time = between(0.1, 0.5)

    @task
    def health(self):
        self.client.get("/health", name="/health")
