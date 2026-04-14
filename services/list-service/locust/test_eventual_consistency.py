"""
Experiment 2b Extension — Eventual Consistency Gap on User Deletion

Demonstrates the eventual consistency gap inherent in the database-per-service
pattern: when a user is deleted from user_db, their stateless JWT remains valid,
and List Service continues to accept their requests until the token expires.

Steps:
  1. Register a user via User Service → get JWT
  2. Create a section + items in List Service using that JWT
  3. Delete the user directly from user_db (simulating admin deletion)
  4. Verify the JWT still works on List Service (consistency gap)
  5. Verify the user is gone from User Service (GET /me returns 401/404)
  6. Show orphaned data persists in list_db with no cleanup mechanism

Usage:
  python test_eventual_consistency.py

Requires:
  - Docker Compose stack running (postgres, user-service, list-service)
  - pip install requests psycopg PyJWT
"""

import os
import sys
import time

import psycopg
import requests

USER_SERVICE = os.getenv("USER_SERVICE_URL", "http://localhost:4001")
LIST_SERVICE = os.getenv("LIST_SERVICE_URL", "http://localhost:4002")
USER_DB_URL = os.getenv("USER_DB_URL", "postgres://sga:sga_secret@localhost:5432/user_db")
LIST_DB_URL = os.getenv("LIST_DB_URL", "postgres://sga:sga_secret@localhost:5432/list_db")


def section_sep(title: str):
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}\n")


def main():
    results = {}

    # ── Step 1: Register a user ──────────────────────────────────────────────
    section_sep("Step 1: Register user via User Service")

    email = f"consistency-test-{int(time.time())}@test.com"
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
    print(f"  Created user: {user_id}")
    print(f"  Email: {email}")
    print(f"  JWT obtained: {token[:40]}...")

    # ── Step 2: Create section + items in List Service ───────────────────────
    section_sep("Step 2: Create list data via List Service")

    resp = requests.post(
        f"{LIST_SERVICE}/api/v1/lists/sections",
        json={"name": "eventual-consistency-test", "position": 0},
        headers=headers,
    )
    assert resp.status_code == 201, f"Section creation failed: {resp.status_code} {resp.text}"
    section_id = resp.json()["id"]
    print(f"  Created section: {section_id}")

    item_ids = []
    for i in range(3):
        resp = requests.post(
            f"{LIST_SERVICE}/api/v1/lists/sections/{section_id}/items",
            json={"name_en": f"test-item-{i}", "quantity": 1},
            headers=headers,
        )
        assert resp.status_code == 201, f"Item creation failed: {resp.status_code}"
        item_ids.append(resp.json()["id"])
    print(f"  Created {len(item_ids)} items: {[iid[:8] + '...' for iid in item_ids]}")

    # Verify data exists
    resp = requests.get(
        f"{LIST_SERVICE}/api/v1/lists/sections/{section_id}/items",
        headers=headers,
    )
    assert resp.status_code == 200
    items_before = resp.json()["items"]
    print(f"  Verified: {len(items_before)} items accessible via List Service")

    # ── Step 3: Delete user from user_db ─────────────────────────────────────
    section_sep("Step 3: Delete user directly from user_db")

    with psycopg.connect(USER_DB_URL) as conn:
        with conn.cursor() as cur:
            # Delete profile first (FK constraint)
            cur.execute("DELETE FROM profiles WHERE user_id = %s", (user_id,))
            profiles_deleted = cur.rowcount
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
            users_deleted = cur.rowcount
        conn.commit()

    print(f"  Deleted from user_db: {users_deleted} user, {profiles_deleted} profile")

    # Verify user is gone from User Service
    resp = requests.get(f"{USER_SERVICE}/api/v1/users/me", headers=headers)
    print(f"  User Service GET /me: HTTP {resp.status_code}")
    results["user_service_after_delete"] = resp.status_code

    # ── Step 4: Test List Service with the orphaned JWT ──────────────────────
    section_sep("Step 4: Test List Service with deleted user's JWT")

    print("  The JWT is stateless — List Service validates the signature but")
    print("  does NOT check if the user still exists in user_db.\n")

    # 4a. Read items
    resp = requests.get(
        f"{LIST_SERVICE}/api/v1/lists/sections/{section_id}/items",
        headers=headers,
    )
    print(f"  GET items:    HTTP {resp.status_code} — {len(resp.json().get('items', []))} items returned")
    results["read_after_delete"] = resp.status_code

    # 4b. Create new item
    resp = requests.post(
        f"{LIST_SERVICE}/api/v1/lists/sections/{section_id}/items",
        json={"name_en": "orphan-item-created-after-user-deletion", "quantity": 1},
        headers=headers,
    )
    print(f"  POST item:    HTTP {resp.status_code} — {'item created!' if resp.status_code == 201 else 'rejected'}")
    results["create_after_delete"] = resp.status_code
    if resp.status_code == 201:
        item_ids.append(resp.json()["id"])

    # 4c. Update existing item
    resp = requests.put(
        f"{LIST_SERVICE}/api/v1/lists/items/{item_ids[0]}",
        json={"name_en": "updated-after-user-deletion"},
        headers=headers,
    )
    print(f"  PUT item:     HTTP {resp.status_code} — {'item updated!' if resp.status_code == 200 else 'rejected'}")
    results["update_after_delete"] = resp.status_code

    # 4d. Delete an item
    resp = requests.delete(
        f"{LIST_SERVICE}/api/v1/lists/items/{item_ids[1]}",
        headers=headers,
    )
    print(f"  DELETE item:  HTTP {resp.status_code} — {'item deleted!' if resp.status_code == 204 else 'rejected'}")
    results["delete_after_delete"] = resp.status_code

    # 4e. Create new section
    resp = requests.post(
        f"{LIST_SERVICE}/api/v1/lists/sections",
        json={"name": "orphan-section-after-deletion", "position": 1},
        headers=headers,
    )
    print(f"  POST section: HTTP {resp.status_code} — {'section created!' if resp.status_code == 201 else 'rejected'}")
    results["create_section_after_delete"] = resp.status_code

    # ── Step 5: Verify orphaned data in list_db ──────────────────────────────
    section_sep("Step 5: Verify orphaned data in list_db")

    with psycopg.connect(LIST_DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM sections WHERE user_id = %s AND deleted_at IS NULL",
                (user_id,),
            )
            orphan_sections = cur.fetchone()[0]

            cur.execute(
                """SELECT COUNT(*) FROM items i
                   JOIN sections s ON s.id = i.section_id
                   WHERE s.user_id = %s AND i.deleted_at IS NULL""",
                (user_id,),
            )
            orphan_items = cur.fetchone()[0]

    print(f"  Orphaned sections in list_db: {orphan_sections}")
    print(f"  Orphaned active items in list_db: {orphan_items}")
    print(f"  User exists in user_db: NO (deleted)")
    print()
    print("  These orphaned records have no owner in user_db.")
    print("  No cleanup mechanism exists — they persist indefinitely.")

    # ── Summary ──────────────────────────────────────────────────────────────
    section_sep("Summary: Eventual Consistency Gap")

    user_svc_blocked = results["user_service_after_delete"] in (401, 404)
    list_svc_allowed = all(
        results[k] in (200, 201, 204)
        for k in ("read_after_delete", "create_after_delete",
                   "update_after_delete", "delete_after_delete",
                   "create_section_after_delete")
    )

    print(f"  User Service blocks deleted user:     {'YES' if user_svc_blocked else 'NO'} (HTTP {results['user_service_after_delete']})")
    print(f"  List Service still accepts deleted user's JWT: {'YES' if list_svc_allowed else 'NO'}")
    print()

    if list_svc_allowed:
        print("  CONFIRMED: Eventual consistency gap exists.")
        print()
        print("  Root cause: JWTs are stateless. List Service validates the")
        print("  token signature and extracts user_id from the 'sub' claim,")
        print("  but never checks user_db to confirm the user still exists.")
        print("  The token remains valid until its 'exp' claim expires.")
        print()
        print("  Impact:")
        print("  - Deleted user can continue reading/writing list data")
        print("  - New orphaned data can be created in list_db")
        print("  - No automatic cleanup of existing orphaned data")
        print()
        print("  Mitigations (not yet implemented):")
        print("  1. Event-driven saga: User Service publishes 'user.deleted'")
        print("     event via RabbitMQ → List Service soft-deletes all")
        print("     sections/items for that user_id")
        print("  2. JWT revocation list: short-lived cache of revoked tokens")
        print("     checked by List Service middleware")
        print("  3. Periodic cleanup job: scan list_db for user_ids that no")
        print("     longer exist in user_db and soft-delete orphaned data")
        print("  4. Short JWT TTL: reduce the window (currently 1 hour) to")
        print("     limit how long a deleted user's token remains valid")
    else:
        print("  NOT CONFIRMED: List Service rejected the deleted user's JWT.")

    # ── Cleanup ──────────────────────────────────────────────────────────────
    section_sep("Cleanup")

    with psycopg.connect(LIST_DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM items WHERE section_id IN (SELECT id FROM sections WHERE user_id = %s)", (user_id,))
            items_cleaned = cur.rowcount
            cur.execute("DELETE FROM sections WHERE user_id = %s", (user_id,))
            sections_cleaned = cur.rowcount
        conn.commit()

    print(f"  Cleaned up: {sections_cleaned} sections, {items_cleaned} items from list_db")

    sys.exit(0 if list_svc_allowed else 1)


if __name__ == "__main__":
    main()
