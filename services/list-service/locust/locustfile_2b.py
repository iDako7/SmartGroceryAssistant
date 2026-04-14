"""
Experiment 2b — Cross-Database Ownership Enforcement Under Load

Question: Do ownership checks that span two databases (list_db and user_db)
remain correct under concurrent access?

Setup: 5 synthetic users, each owning 2 sections with 3 seed items each.
80% of requests use the correct owner's JWT (LegitimateUser, weight=4).
20% use a different user's JWT on someone else's section (UnauthorizedUser, weight=1).

Independent variable : number of concurrent users (1, 5, 10)
Dependent variables  : ownership enforcement correctness, latency, false-rejection rate
Controlled variables : same hardware, 60-second duration, fixed 80/20 split

Usage:
  locust -f locustfile_2b.py --host http://localhost:4002 \
    --headless -u 5 -r 5 --run-time 60s \
    --csv results/2b_5users --html results/2b_5users.html
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
OPS_LOG_FILE = os.getenv("OPS_LOG_FILE", "results/2b_ops_log.json")
NUM_USERS = 5
SECTIONS_PER_USER = 2
SEED_ITEMS_PER_SECTION = 3

# ── Shared state ─────────────────────────────────────────────────────────────

_setup_lock = threading.Lock()
_setup_done = False

# user_id -> {"jwt": str, "sections": [{"id": str, "item_ids": [str]}]}
users: dict[str, dict] = {}

# Flat list of (user_id, section_id) for quick random access
all_sections: list[tuple[str, str]] = []

# Operations log
ops_log: list[dict] = []
ops_log_lock = threading.Lock()


def _mint_jwt(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def _log_op(op: str, authorized: bool, user_id: str, section_owner: str,
            section_id: str, status_code: int):
    with ops_log_lock:
        ops_log.append(
            {
                "op": op,
                "authorized": authorized,
                "user_id": user_id,
                "section_owner": section_owner,
                "section_id": section_id,
                "status_code": status_code,
                "timestamp": time.time(),
            }
        )


def _do_setup(client):
    """Create 5 users, each with 2 sections and 3 seed items per section."""
    global _setup_done

    with _setup_lock:
        if _setup_done:
            return
        for _ in range(NUM_USERS):
            uid = str(uuid.uuid4())
            token = _mint_jwt(uid)
            headers = {"Authorization": f"Bearer {token}"}
            user_sections = []

            for s in range(SECTIONS_PER_USER):
                resp = client.post(
                    "/api/v1/lists/sections",
                    json={"name": f"user-{uid[:8]}-section-{s}", "position": s},
                    headers=headers,
                    name="[setup] create section",
                )
                assert resp.status_code == 201, f"Setup section failed: {resp.status_code}"
                sec_id = resp.json()["id"]
                sec_items = []

                for i in range(SEED_ITEMS_PER_SECTION):
                    resp = client.post(
                        f"/api/v1/lists/sections/{sec_id}/items",
                        json={"name_en": f"seed-{uid[:4]}-{s}-{i}", "quantity": 1},
                        headers=headers,
                        name="[setup] create seed item",
                    )
                    assert resp.status_code == 201, f"Setup item failed: {resp.status_code}"
                    sec_items.append(resp.json()["id"])

                user_sections.append({"id": sec_id, "item_ids": sec_items})
                all_sections.append((uid, sec_id))

            users[uid] = {"jwt": token, "sections": user_sections}

        _setup_done = True


@events.quitting.add_listener
def _dump_ops_log(environment, **kwargs):
    with ops_log_lock:
        snapshot = list(ops_log)
    os.makedirs(os.path.dirname(OPS_LOG_FILE) or ".", exist_ok=True)
    with open(OPS_LOG_FILE, "w") as f:
        json.dump(
            {
                "users": {uid: {"sections": u["sections"]} for uid, u in users.items()},
                "operations": snapshot,
            },
            f,
            indent=2,
        )
    print(f"\n[2b] Operations log written to {OPS_LOG_FILE} ({len(snapshot)} ops)")


# ── Legitimate user (80%) ────────────────────────────────────────────────────


class LegitimateUser(HttpUser):
    """Uses correct owner JWT to operate on own sections."""

    weight = 4
    wait_time = between(0.2, 1.0)

    def on_start(self):
        _do_setup(self.client)
        # Pick a random user to impersonate for this session
        self.uid = random.choice(list(users.keys()))
        self.token = users[self.uid]["jwt"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.user_sections = users[self.uid]["sections"]

    def _pick_section(self):
        return random.choice(self.user_sections)

    @task(4)
    def get_items(self):
        sec = self._pick_section()
        with self.client.get(
            f"/api/v1/lists/sections/{sec['id']}/items",
            headers=self.headers,
            name="[legit] GET /sections/:id/items",
            catch_response=True,
        ) as resp:
            _log_op("get_items", True, self.uid, self.uid, sec["id"], resp.status_code)
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"legit get failed: {resp.status_code}")

    @task(3)
    def add_item(self):
        sec = self._pick_section()
        with self.client.post(
            f"/api/v1/lists/sections/{sec['id']}/items",
            json={"name_en": f"legit-{uuid.uuid4().hex[:6]}", "quantity": 1},
            headers=self.headers,
            name="[legit] POST /items (add)",
            catch_response=True,
        ) as resp:
            _log_op("add", True, self.uid, self.uid, sec["id"], resp.status_code)
            if resp.status_code == 201:
                sec["item_ids"].append(resp.json()["id"])
                resp.success()
            else:
                resp.failure(f"legit add failed: {resp.status_code}")

    @task(2)
    def update_item(self):
        sec = self._pick_section()
        if not sec["item_ids"]:
            return
        item_id = random.choice(sec["item_ids"])
        with self.client.put(
            f"/api/v1/lists/items/{item_id}",
            json={"name_en": f"legit-upd-{uuid.uuid4().hex[:4]}"},
            headers=self.headers,
            name="[legit] PUT /items/:id (update)",
            catch_response=True,
        ) as resp:
            _log_op("update", True, self.uid, self.uid, sec["id"], resp.status_code)
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"legit update failed: {resp.status_code}")

    @task(1)
    def delete_item(self):
        sec = self._pick_section()
        if not sec["item_ids"]:
            return
        item_id = sec["item_ids"].pop(random.randrange(len(sec["item_ids"])))
        with self.client.delete(
            f"/api/v1/lists/items/{item_id}",
            headers=self.headers,
            name="[legit] DELETE /items/:id",
            catch_response=True,
        ) as resp:
            _log_op("delete", True, self.uid, self.uid, sec["id"], resp.status_code)
            if resp.status_code == 204:
                resp.success()
            elif resp.status_code == 500:
                resp.success()  # already deleted by another user instance
            else:
                resp.failure(f"legit delete failed: {resp.status_code}")


# ── Unauthorized user (20%) ──────────────────────────────────────────────────


class UnauthorizedUser(HttpUser):
    """Uses one user's JWT to attempt operations on another user's section."""

    weight = 1
    wait_time = between(0.2, 1.0)

    def on_start(self):
        _do_setup(self.client)
        # Pick an attacker identity
        user_ids = list(users.keys())
        self.attacker_uid = random.choice(user_ids)
        self.attacker_jwt = users[self.attacker_uid]["jwt"]
        self.headers = {"Authorization": f"Bearer {self.attacker_jwt}"}
        # Pick a victim (different user)
        victims = [uid for uid in user_ids if uid != self.attacker_uid]
        self.victim_uid = random.choice(victims)
        self.victim_sections = users[self.victim_uid]["sections"]

    def _pick_victim_section(self):
        return random.choice(self.victim_sections)

    @task(3)
    def get_items_unauthorized(self):
        sec = self._pick_victim_section()
        with self.client.get(
            f"/api/v1/lists/sections/{sec['id']}/items",
            headers=self.headers,
            name="[unauth] GET /sections/:id/items",
            catch_response=True,
        ) as resp:
            _log_op("get_items", False, self.attacker_uid, self.victim_uid,
                     sec["id"], resp.status_code)
            # Ownership JOIN should return empty list or 403/404/500
            if resp.status_code == 200:
                items = resp.json().get("items", [])
                if len(items) == 0:
                    resp.success()  # empty = ownership filter worked
                else:
                    resp.failure(f"BREACH: got {len(items)} items from another user's section")
            else:
                resp.success()  # non-200 is expected

    @task(3)
    def add_item_unauthorized(self):
        sec = self._pick_victim_section()
        with self.client.post(
            f"/api/v1/lists/sections/{sec['id']}/items",
            json={"name_en": f"unauth-{uuid.uuid4().hex[:6]}", "quantity": 1},
            headers=self.headers,
            name="[unauth] POST /items (add)",
            catch_response=True,
        ) as resp:
            _log_op("add", False, self.attacker_uid, self.victim_uid,
                     sec["id"], resp.status_code)
            if resp.status_code == 201:
                resp.failure("BREACH: unauthorized item creation succeeded!")
            else:
                resp.success()  # rejection is correct

    @task(2)
    def update_item_unauthorized(self):
        sec = self._pick_victim_section()
        if not sec["item_ids"]:
            return
        item_id = random.choice(sec["item_ids"])
        with self.client.put(
            f"/api/v1/lists/items/{item_id}",
            json={"name_en": f"unauth-upd-{uuid.uuid4().hex[:4]}"},
            headers=self.headers,
            name="[unauth] PUT /items/:id (update)",
            catch_response=True,
        ) as resp:
            _log_op("update", False, self.attacker_uid, self.victim_uid,
                     sec["id"], resp.status_code)
            if resp.status_code == 200:
                resp.failure("BREACH: unauthorized item update succeeded!")
            else:
                resp.success()

    @task(2)
    def delete_item_unauthorized(self):
        sec = self._pick_victim_section()
        if not sec["item_ids"]:
            return
        item_id = random.choice(sec["item_ids"])
        with self.client.delete(
            f"/api/v1/lists/items/{item_id}",
            headers=self.headers,
            name="[unauth] DELETE /items/:id",
            catch_response=True,
        ) as resp:
            _log_op("delete", False, self.attacker_uid, self.victim_uid,
                     sec["id"], resp.status_code)
            if resp.status_code == 204:
                resp.failure("BREACH: unauthorized item deletion succeeded!")
            else:
                resp.success()
