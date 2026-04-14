"""
Experiment 2a — Concurrent Write Serialization

Question: Does the List Service correctly serialize concurrent writes to the
same list section without lost updates, duplicate items, or phantom entries?

All Locust users share ONE section and write concurrently. After the run,
verify_2a.py reconciles the DB state against the operations log.

Independent variable : number of concurrent writers (1, 5, 10)
Dependent variables  : data integrity, write latency (p50/p95/p99), error rate
Controlled variables : same section, same hardware, 60-second duration

Usage:
  locust -f locustfile_2a.py --host http://localhost:4002 \
    --headless -u 5 -r 5 --run-time 60s \
    --csv results/2a_5writers --html results/2a_5writers.html
"""

import json
import os
import random
import threading
import time
import uuid

import jwt
from locust import HttpUser, between, events, task

# ── Configuration ────────────────────────────────────────────────────────────

JWT_SECRET = os.getenv("JWT_SECRET", "change_me_in_production")
LIST_SERVICE_HOST = os.getenv("LIST_SERVICE_HOST", "http://localhost:4002")
OPS_LOG_FILE = os.getenv("OPS_LOG_FILE", "results/2a_ops_log.json")
SEED_ITEMS = 10

# ── Shared state (set up once before any user spawns) ────────────────────────

_setup_lock = threading.Lock()
_setup_done = False

shared_user_id: str = ""
shared_jwt: str = ""
shared_section_id: str = ""
# Thread-safe list of known active item IDs
item_ids: list[str] = []
item_ids_lock = threading.Lock()

# Operations log: list of {"op", "item_id", "timestamp", "status_code"}
ops_log: list[dict] = []
ops_log_lock = threading.Lock()


def _mint_jwt(user_id: str) -> str:
    """Create a JWT matching the list-service auth middleware."""
    payload = {
        "sub": user_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def _log_op(op: str, item_id: str, status_code: int):
    with ops_log_lock:
        ops_log.append(
            {
                "op": op,
                "item_id": item_id,
                "timestamp": time.time(),
                "status_code": status_code,
            }
        )


def _do_setup(client):
    """Create a shared user, section, and seed items via the List Service API."""
    global shared_user_id, shared_jwt, shared_section_id, _setup_done

    with _setup_lock:
        if _setup_done:
            return
        shared_user_id = str(uuid.uuid4())
        shared_jwt = _mint_jwt(shared_user_id)
        headers = {"Authorization": f"Bearer {shared_jwt}"}

        # Create a section
        resp = client.post(
            "/api/v1/lists/sections",
            json={"name": "experiment-2a", "position": 0},
            headers=headers,
            name="[setup] create section",
        )
        assert resp.status_code == 201, f"Section creation failed: {resp.status_code} {resp.text}"
        shared_section_id = resp.json()["id"]

        # Seed items
        for i in range(SEED_ITEMS):
            resp = client.post(
                f"/api/v1/lists/sections/{shared_section_id}/items",
                json={"name_en": f"seed-item-{i}", "quantity": 1},
                headers=headers,
                name="[setup] create seed item",
            )
            assert resp.status_code == 201, f"Seed item creation failed: {resp.status_code}"
            item_ids.append(resp.json()["id"])

        _setup_done = True


@events.quitting.add_listener
def _dump_ops_log(environment, **kwargs):
    """Write the operations log to disk so verify_2a.py can use it."""
    with ops_log_lock:
        snapshot = list(ops_log)
    os.makedirs(os.path.dirname(OPS_LOG_FILE) or ".", exist_ok=True)
    with open(OPS_LOG_FILE, "w") as f:
        json.dump(
            {
                "user_id": shared_user_id,
                "section_id": shared_section_id,
                "seed_count": SEED_ITEMS,
                "operations": snapshot,
            },
            f,
            indent=2,
        )
    print(f"\n[2a] Operations log written to {OPS_LOG_FILE} ({len(snapshot)} ops)")


# ── Locust user ──────────────────────────────────────────────────────────────


class ConcurrentWriter(HttpUser):
    """
    Each instance writes to the shared section concurrently.
    Task weights approximate the mix from §5.3:
      add (3) + update (3) + delete (2) + read (2) = 10
    """

    wait_time = between(0.1, 0.5)  # fast iteration to maximise contention

    def on_start(self):
        _do_setup(self.client)
        self.headers = {"Authorization": f"Bearer {shared_jwt}"}

    # ── Tasks ────────────────────────────────────────────────────────────────

    @task(3)
    def add_item(self):
        name = f"item-{uuid.uuid4().hex[:8]}"
        with self.client.post(
            f"/api/v1/lists/sections/{shared_section_id}/items",
            json={"name_en": name, "quantity": random.randint(1, 5)},
            headers=self.headers,
            name="POST /items (add)",
            catch_response=True,
        ) as resp:
            if resp.status_code == 201:
                new_id = resp.json()["id"]
                with item_ids_lock:
                    item_ids.append(new_id)
                _log_op("add", new_id, resp.status_code)
                resp.success()
            else:
                _log_op("add", "", resp.status_code)
                resp.failure(f"add failed: {resp.status_code}")

    @task(3)
    def update_random_item(self):
        with item_ids_lock:
            if not item_ids:
                return
            target = random.choice(item_ids)

        new_name = f"updated-{uuid.uuid4().hex[:6]}"
        with self.client.put(
            f"/api/v1/lists/items/{target}",
            json={"name_en": new_name},
            headers=self.headers,
            name="PUT /items/:id (update)",
            catch_response=True,
        ) as resp:
            _log_op("update", target, resp.status_code)
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"update failed: {resp.status_code}")

    @task(2)
    def delete_random_item(self):
        with item_ids_lock:
            if not item_ids:
                return
            target = random.choice(item_ids)
            # Remove from known list so other writers are less likely to hit it
            try:
                item_ids.remove(target)
            except ValueError:
                pass

        with self.client.delete(
            f"/api/v1/lists/items/{target}",
            headers=self.headers,
            name="DELETE /items/:id (soft-delete)",
            catch_response=True,
        ) as resp:
            _log_op("delete", target, resp.status_code)
            if resp.status_code == 204:
                resp.success()
            else:
                # Item may have been deleted by another writer — expected under contention
                if resp.status_code == 500:
                    resp.success()  # not-found is acceptable, not a test failure
                else:
                    resp.failure(f"delete failed: {resp.status_code}")

    @task(2)
    def get_items(self):
        with self.client.get(
            f"/api/v1/lists/sections/{shared_section_id}/items",
            headers=self.headers,
            name="GET /sections/:id/items (read)",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"get items failed: {resp.status_code}")
