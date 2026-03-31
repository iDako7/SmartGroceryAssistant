"""
Load tests for User Service — realistic baseline workload.

Traffic model (mirrors a grocery app's typical session pattern):
  - A user opens the app → login (once per session)
  - Views profile multiple times (navigating settings, viewing preferences)
  - Occasionally updates preferences (dietary restrictions, household size)
  - New registrations are rare relative to returning-user traffic

Workload mix (approximate % of total requests):
  ~5%  POST /api/v1/users/register   — new signups
  ~15% POST /api/v1/users/login      — session starts
  ~60% GET  /api/v1/users/me          — profile reads (most frequent)
  ~15% PUT  /api/v1/users/me          — profile updates
  ~5%  GET  /health                    — infra health checks

Baseline target: 100 concurrent users, ramp 10 users/sec, 2-minute run.

Usage:
  # Web UI (http://localhost:8089)
  locust -f locustfile.py --host http://localhost:4001

  # Headless baseline
  locust -f locustfile.py --host http://localhost:4001 \
    --headless -u 100 -r 10 --run-time 2m \
    --csv results/baseline --html results/baseline.html
"""

import random
import string
import uuid

from locust import HttpUser, between, tag, task


def random_email():
    uid = uuid.uuid4().hex[:8]
    return f"loadtest_{uid}@test.com"


def random_password():
    return "".join(random.choices(string.ascii_letters + string.digits, k=12)) + "Aa1!"


LANGUAGES = ["en", "zh", "es", "fr", "ja", "ko"]
DIETS = ["vegetarian", "vegan", "gluten-free", "dairy-free", "nut-free", "halal", "kosher"]
TASTES = ["spicy", "mild", "sweet", "savory", "balanced", "umami"]


class ReturningUser(HttpUser):
    """
    Represents an existing user who logs in and interacts with their profile.
    This is the dominant traffic pattern (~90% of real users).
    """

    weight = 9  # 9:1 ratio vs new registrations
    wait_time = between(2, 5)  # realistic think time between actions

    def on_start(self):
        """Register once, then log in to simulate a returning user."""
        self.email = random_email()
        self.password = random_password()

        # One-time registration (not counted as part of steady-state load)
        with self.client.post(
            "/api/v1/users/register",
            json={"email": self.email, "password": self.password},
            name="/api/v1/users/register [setup]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 201:
                resp.success()
            else:
                resp.failure(f"Setup registration failed: {resp.status_code}")

        # Login to get JWT — this is the real session start
        self._do_login()

    def _do_login(self):
        with self.client.post(
            "/api/v1/users/login",
            json={"email": self.email, "password": self.password},
            name="/api/v1/users/login",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                self.token = resp.json().get("token", "")
                self.headers = {"Authorization": f"Bearer {self.token}"}
                resp.success()
            else:
                self.token = ""
                self.headers = {}
                resp.failure(f"Login failed: {resp.status_code}")

    @tag("read")
    @task(12)
    def get_profile(self):
        """Most frequent action — user views their profile/settings."""
        self.client.get(
            "/api/v1/users/me",
            headers=self.headers,
            name="/api/v1/users/me",
        )

    @tag("write")
    @task(3)
    def update_profile(self):
        """User updates preferences — less frequent than reads."""
        self.client.put(
            "/api/v1/users/me",
            headers=self.headers,
            json={
                "language_preference": random.choice(LANGUAGES),
                "dietary_restrictions": random.sample(
                    DIETS, k=random.randint(0, 3)
                ),
                "household_size": random.randint(1, 6),
                "taste_preferences": random.choice(TASTES),
            },
            name="/api/v1/users/me [PUT]",
        )

    @tag("auth")
    @task(3)
    def login(self):
        """Simulates token refresh / re-login during a session."""
        self._do_login()

    @tag("infra")
    @task(1)
    def health_check(self):
        self.client.get("/health", name="/health")


class NewUser(HttpUser):
    """
    Represents new user registration traffic.
    Much lower volume than returning users (~10% of traffic).
    Each task iteration registers a fresh account and fetches the profile once.
    """

    weight = 1
    wait_time = between(3, 8)  # new users take longer (filling out forms, etc.)

    @tag("auth", "write")
    @task
    def register_and_view_profile(self):
        """Full new-user flow: register → view profile."""
        email = random_email()
        password = random_password()

        with self.client.post(
            "/api/v1/users/register",
            json={"email": email, "password": password},
            name="/api/v1/users/register",
            catch_response=True,
        ) as resp:
            if resp.status_code == 201:
                token = resp.json().get("token", "")
                resp.success()
            else:
                resp.failure(f"Registration failed: {resp.status_code}")
                return

        # New user immediately views their profile after signup
        self.client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {token}"},
            name="/api/v1/users/me",
        )
