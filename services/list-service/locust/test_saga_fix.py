"""
Test: Event-Driven Saga Fix for Eventual Consistency Gap

Verifies that when a user is deleted via DELETE /api/v1/users/me,
the user.deleted event is published to RabbitMQ, consumed by the
List Service, and all orphaned data is soft-deleted automatically.

Steps:
  1. Register user, create list data
  2. Delete user via the new DELETE /api/v1/users/me endpoint
  3. Wait briefly for the event to propagate
  4. Verify orphaned data in list_db has been soft-deleted

Usage:
  python test_saga_fix.py
"""

import os
import sys
import time

import psycopg
import requests

USER_SERVICE = os.getenv("USER_SERVICE_URL", "http://localhost:4001")
LIST_SERVICE = os.getenv("LIST_SERVICE_URL", "http://localhost:4002")
LIST_DB_URL = os.getenv("LIST_DB_URL", "postgres://sga:sga_secret@localhost:5432/list_db")


def section_sep(title: str):
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}\n")


def main():
    # ── Step 1: Register user + create list data ─────────────────────────
    section_sep("Step 1: Register user and create list data")

    email = f"saga-test-{int(time.time())}@test.com"
    password = "TestPassword123!"

    resp = requests.post(
        f"{USER_SERVICE}/api/v1/users/register",
        json={"email": email, "password": password},
    )
    assert resp.status_code == 201, f"Registration failed: {resp.status_code} {resp.text}"
    data = resp.json()
    token = data["token"]
    user_id = data["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"  User: {user_id}")

    # Create section + items
    resp = requests.post(
        f"{LIST_SERVICE}/api/v1/lists/sections",
        json={"name": "saga-test-section", "position": 0},
        headers=headers,
    )
    assert resp.status_code == 201
    section_id = resp.json()["id"]

    for i in range(3):
        resp = requests.post(
            f"{LIST_SERVICE}/api/v1/lists/sections/{section_id}/items",
            json={"name_en": f"saga-item-{i}", "quantity": 1},
            headers=headers,
        )
        assert resp.status_code == 201
    print(f"  Created section {section_id[:8]}... with 3 items")

    # Verify data exists
    with psycopg.connect(LIST_DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM items i JOIN sections s ON s.id = i.section_id "
                "WHERE s.user_id = %s AND i.deleted_at IS NULL", (user_id,),
            )
            items_before = cur.fetchone()[0]
            cur.execute(
                "SELECT COUNT(*) FROM sections WHERE user_id = %s AND deleted_at IS NULL",
                (user_id,),
            )
            sections_before = cur.fetchone()[0]
    print(f"  Active in DB: {sections_before} sections, {items_before} items")

    # ── Step 2: Delete user via API ──────────────────────────────────────
    section_sep("Step 2: Delete user via DELETE /api/v1/users/me")

    resp = requests.delete(f"{USER_SERVICE}/api/v1/users/me", headers=headers)
    print(f"  DELETE /users/me: HTTP {resp.status_code}")
    assert resp.status_code == 204, f"Delete failed: {resp.status_code} {resp.text}"

    # ── Step 3: Wait for event propagation ───────────────────────────────
    section_sep("Step 3: Wait for user.deleted event propagation")

    max_wait = 10  # seconds
    poll_interval = 0.5
    elapsed = 0
    cleaned = False

    while elapsed < max_wait:
        time.sleep(poll_interval)
        elapsed += poll_interval

        with psycopg.connect(LIST_DB_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT COUNT(*) FROM sections WHERE user_id = %s AND deleted_at IS NULL",
                    (user_id,),
                )
                active_sections = cur.fetchone()[0]

        if active_sections == 0:
            cleaned = True
            print(f"  Cleanup detected after {elapsed:.1f}s")
            break
        print(f"  Polling... {elapsed:.1f}s — {active_sections} sections still active")

    # ── Step 4: Verify cleanup ───────────────────────────────────────────
    section_sep("Step 4: Verify cleanup in list_db")

    with psycopg.connect(LIST_DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM sections WHERE user_id = %s AND deleted_at IS NULL",
                (user_id,),
            )
            active_sections = cur.fetchone()[0]
            cur.execute(
                "SELECT COUNT(*) FROM sections WHERE user_id = %s AND deleted_at IS NOT NULL",
                (user_id,),
            )
            deleted_sections = cur.fetchone()[0]
            cur.execute(
                "SELECT COUNT(*) FROM items i JOIN sections s ON s.id = i.section_id "
                "WHERE s.user_id = %s AND i.deleted_at IS NULL", (user_id,),
            )
            active_items = cur.fetchone()[0]
            cur.execute(
                "SELECT COUNT(*) FROM items i JOIN sections s ON s.id = i.section_id "
                "WHERE s.user_id = %s AND i.deleted_at IS NOT NULL", (user_id,),
            )
            deleted_items = cur.fetchone()[0]

    print(f"  Active sections:      {active_sections} (expected: 0)")
    print(f"  Soft-deleted sections: {deleted_sections} (expected: {sections_before})")
    print(f"  Active items:         {active_items} (expected: 0)")
    print(f"  Soft-deleted items:   {deleted_items} (expected: {items_before})")

    # ── Summary ──────────────────────────────────────────────────────────
    section_sep("Summary")

    if cleaned and active_sections == 0 and active_items == 0:
        print("  PASS: Event-driven saga successfully cleaned up orphaned data")
        print(f"  - User deleted from user_db")
        print(f"  - user.deleted event propagated via RabbitMQ")
        print(f"  - List Service consumed event and soft-deleted:")
        print(f"    {deleted_sections} sections, {deleted_items} items")
        print(f"  - Cleanup latency: {elapsed:.1f}s")
        sys.exit(0)
    else:
        print("  FAIL: Orphaned data was NOT cleaned up")
        if not cleaned:
            print(f"  - Timed out after {max_wait}s waiting for cleanup")
        print(f"  - {active_sections} sections still active")
        print(f"  - {active_items} items still active")
        sys.exit(1)


if __name__ == "__main__":
    main()
