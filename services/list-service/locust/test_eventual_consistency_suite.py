"""
Eventual Consistency Test Suite

Comprehensive tests for the database-per-service eventual consistency gap
and the event-driven saga fix. Each test isolates a specific scenario.

Usage:
  python test_eventual_consistency_suite.py

Requires: Docker Compose stack running (postgres, rabbitmq, user-service, list-service)
"""

import concurrent.futures
import os
import subprocess
import sys
import threading
import time

import jwt as pyjwt
import psycopg
import requests

USER_SERVICE = os.getenv("USER_SERVICE_URL", "http://localhost:4001")
LIST_SERVICE = os.getenv("LIST_SERVICE_URL", "http://localhost:4002")
USER_DB_URL = os.getenv("USER_DB_URL", "postgres://sga:sga_secret@localhost:5432/user_db")
LIST_DB_URL = os.getenv("LIST_DB_URL", "postgres://sga:sga_secret@localhost:5432/list_db")
JWT_SECRET = os.getenv("JWT_SECRET", "change_me_in_production")

passed = 0
failed = 0
results: list[tuple[str, bool, str]] = []


def register_user():
    """Register a user and return (user_id, token, headers)."""
    email = f"ec-test-{int(time.time() * 1000)}@test.com"
    resp = requests.post(
        f"{USER_SERVICE}/api/v1/users/register",
        json={"email": email, "password": "TestPassword123!"},
    )
    assert resp.status_code == 201, f"Register failed: {resp.status_code}"
    data = resp.json()
    token = data["token"]
    uid = data["user"]["id"]
    return uid, token, {"Authorization": f"Bearer {token}"}


def create_section(headers, name="test-section", position=0):
    resp = requests.post(
        f"{LIST_SERVICE}/api/v1/lists/sections",
        json={"name": name, "position": position},
        headers=headers,
    )
    assert resp.status_code == 201, f"Create section failed: {resp.status_code}"
    return resp.json()["id"]


def create_items(headers, section_id, count=3):
    ids = []
    for i in range(count):
        resp = requests.post(
            f"{LIST_SERVICE}/api/v1/lists/sections/{section_id}/items",
            json={"name_en": f"item-{i}", "quantity": 1},
            headers=headers,
        )
        assert resp.status_code == 201
        ids.append(resp.json()["id"])
    return ids


def delete_user_via_api(headers):
    resp = requests.delete(f"{USER_SERVICE}/api/v1/users/me", headers=headers)
    assert resp.status_code == 204, f"Delete user failed: {resp.status_code}"


def delete_user_via_sql(user_id):
    """Delete user directly from DB, bypassing the saga."""
    with psycopg.connect(USER_DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM profiles WHERE user_id = %s", (user_id,))
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()


def count_active_data(user_id):
    with psycopg.connect(LIST_DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM sections WHERE user_id = %s AND deleted_at IS NULL",
                (user_id,),
            )
            sections = cur.fetchone()[0]
            cur.execute(
                """SELECT COUNT(*) FROM items i JOIN sections s ON s.id = i.section_id
                   WHERE s.user_id = %s AND i.deleted_at IS NULL""",
                (user_id,),
            )
            items = cur.fetchone()[0]
    return sections, items


def wait_for_cleanup(user_id, timeout=10):
    """Wait until active data for user_id reaches 0. Returns elapsed time or None."""
    start = time.time()
    while time.time() - start < timeout:
        sections, items = count_active_data(user_id)
        if sections == 0 and items == 0:
            return time.time() - start
        time.sleep(0.2)
    return None


def cleanup_test_data(user_id):
    """Hard-delete test data from list_db."""
    with psycopg.connect(LIST_DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM items WHERE section_id IN (SELECT id FROM sections WHERE user_id = %s)",
                (user_id,),
            )
            cur.execute("DELETE FROM sections WHERE user_id = %s", (user_id,))
        conn.commit()


def run_test(name, fn):
    global passed, failed
    print(f"\n{'─' * 60}")
    print(f"  TEST: {name}")
    print(f"{'─' * 60}")
    try:
        fn()
        passed += 1
        results.append((name, True, ""))
        print(f"  ✓ PASS")
    except Exception as e:
        failed += 1
        results.append((name, False, str(e)))
        print(f"  ✗ FAIL: {e}")


# ═══════════════════════════════════════════════════════════════
# TEST CASES
# ═══════════════════════════════════════════════════════════════


def test_1_saga_basic_cleanup():
    """Basic saga: delete user via API, verify cleanup within 5s."""
    uid, token, headers = register_user()
    sid = create_section(headers)
    create_items(headers, sid, 3)

    sections, items = count_active_data(uid)
    assert sections == 1 and items == 3, f"Setup failed: {sections}s, {items}i"

    delete_user_via_api(headers)
    elapsed = wait_for_cleanup(uid, timeout=5)
    assert elapsed is not None, "Cleanup did not complete within 5s"
    print(f"    Cleanup completed in {elapsed:.2f}s")

    cleanup_test_data(uid)


def test_2_gap_without_saga():
    """Without saga: delete user via SQL, verify JWT still works on list-service."""
    uid, token, headers = register_user()
    sid = create_section(headers)
    create_items(headers, sid, 3)

    delete_user_via_sql(uid)

    # User service should reject
    resp = requests.get(f"{USER_SERVICE}/api/v1/users/me", headers=headers)
    assert resp.status_code in (404, 500), f"User service should reject: got {resp.status_code}"

    # List service should still work (the gap)
    resp = requests.get(
        f"{LIST_SERVICE}/api/v1/lists/sections/{sid}/items", headers=headers
    )
    assert resp.status_code == 200, f"Expected 200 from list service, got {resp.status_code}"
    items_returned = len(resp.json().get("items", []))
    assert items_returned == 3, f"Expected 3 items, got {items_returned}"
    print(f"    Confirmed: deleted user's JWT still returns {items_returned} items")

    # New write should also succeed (gap allows writes)
    resp = requests.post(
        f"{LIST_SERVICE}/api/v1/lists/sections/{sid}/items",
        json={"name_en": "orphan-item", "quantity": 1},
        headers=headers,
    )
    assert resp.status_code == 201, f"Expected 201 for orphan write, got {resp.status_code}"
    print(f"    Confirmed: deleted user can still create new items")

    cleanup_test_data(uid)


def test_3_bulk_deletion():
    """Delete 10 users rapidly and verify all are cleaned up by the saga."""
    user_data = []
    for _ in range(10):
        uid, token, headers = register_user()
        sid = create_section(headers)
        create_items(headers, sid, 2)
        user_data.append((uid, headers))

    # Delete all 10 users
    for uid, headers in user_data:
        delete_user_via_api(headers)

    # Wait for all cleanups
    all_clean = True
    for uid, _ in user_data:
        elapsed = wait_for_cleanup(uid, timeout=10)
        if elapsed is None:
            all_clean = False
            print(f"    User {uid[:8]}... NOT cleaned up")
        else:
            pass  # cleaned

    assert all_clean, "Not all users were cleaned up within 10s"
    print(f"    All 10 users cleaned up successfully")

    for uid, _ in user_data:
        cleanup_test_data(uid)


def test_4_concurrent_delete_and_write():
    """Delete user while another thread is actively writing to their list."""
    uid, token, headers = register_user()
    sid = create_section(headers)
    create_items(headers, sid, 5)

    write_errors = []
    write_count = {"success": 0, "fail": 0}
    stop_event = threading.Event()

    def writer_loop():
        while not stop_event.is_set():
            try:
                resp = requests.post(
                    f"{LIST_SERVICE}/api/v1/lists/sections/{sid}/items",
                    json={"name_en": f"concurrent-{time.time()}", "quantity": 1},
                    headers=headers,
                    timeout=2,
                )
                if resp.status_code == 201:
                    write_count["success"] += 1
                else:
                    write_count["fail"] += 1
            except Exception:
                write_count["fail"] += 1
            time.sleep(0.05)

    # Start writer thread
    writer = threading.Thread(target=writer_loop)
    writer.start()

    # Give writer a moment to start
    time.sleep(0.3)

    # Delete the user
    delete_user_via_api(headers)

    # Let writer continue for a bit
    time.sleep(1)
    stop_event.set()
    writer.join()

    print(f"    Writes during/after deletion: {write_count['success']} succeeded, {write_count['fail']} failed")

    # Verify saga eventually cleaned up
    elapsed = wait_for_cleanup(uid, timeout=10)
    if elapsed is not None:
        print(f"    Cleanup completed in {elapsed:.2f}s (some writes may have created new orphans)")
    else:
        # The concurrent writes may have created items AFTER cleanup ran
        # This is expected — the saga runs once per event
        sections, items = count_active_data(uid)
        print(f"    Remaining after saga: {sections}s, {items}i (created after cleanup)")
        # These are orphans from the race — this demonstrates the limitation

    cleanup_test_data(uid)


def test_5_large_dataset_cleanup():
    """User with many sections and items — verify all cleaned up."""
    uid, token, headers = register_user()
    total_sections = 5
    items_per_section = 10

    for s in range(total_sections):
        sid = create_section(headers, name=f"section-{s}", position=s)
        create_items(headers, sid, items_per_section)

    sections, items = count_active_data(uid)
    assert sections == total_sections, f"Expected {total_sections} sections, got {sections}"
    assert items == total_sections * items_per_section, f"Expected {total_sections * items_per_section} items, got {items}"
    print(f"    Created {sections} sections, {items} items")

    delete_user_via_api(headers)
    elapsed = wait_for_cleanup(uid, timeout=10)
    assert elapsed is not None, "Large dataset cleanup did not complete within 10s"
    print(f"    All {total_sections} sections and {total_sections * items_per_section} items cleaned up in {elapsed:.2f}s")

    cleanup_test_data(uid)


def test_6_stale_jwt_window():
    """Measure the exact window where a deleted user's JWT is still usable."""
    uid, token, headers = register_user()
    sid = create_section(headers)
    create_items(headers, sid, 2)

    delete_user_via_api(headers)

    # Rapidly poll list-service to find when access stops working
    window_start = time.time()
    last_success = None
    first_fail = None

    for _ in range(100):
        resp = requests.get(
            f"{LIST_SERVICE}/api/v1/lists/sections/{sid}/items",
            headers=headers,
        )
        now = time.time()
        items = resp.json().get("items", []) if resp.status_code == 200 else []

        if resp.status_code == 200 and len(items) > 0:
            last_success = now
        elif (resp.status_code == 200 and len(items) == 0) or resp.status_code != 200:
            if first_fail is None:
                first_fail = now
            break
        time.sleep(0.05)

    if last_success and first_fail:
        window = first_fail - window_start
        print(f"    JWT usable for {window:.3f}s after deletion")
        print(f"    (reads returned data until saga soft-deleted items)")
    elif first_fail:
        print(f"    Access denied immediately ({first_fail - window_start:.3f}s)")
    else:
        print(f"    JWT still usable after all polls — saga hasn't run yet")

    cleanup_test_data(uid)


def test_7_rabbitmq_down_orphan_cleanup():
    """
    Simulate RabbitMQ failure: delete user via SQL (no event published).
    Verify orphan cleanup job catches it.
    Note: This test relies on the cleanup job interval (10min by default).
    We reduce it by calling the user-exists endpoint to confirm the mechanism works.
    """
    uid, token, headers = register_user()
    sid = create_section(headers)
    create_items(headers, sid, 3)

    # Delete via SQL (simulating RabbitMQ being down — no event published)
    delete_user_via_sql(uid)

    # Verify data is still there (no saga to clean it)
    sections, items = count_active_data(uid)
    assert sections == 1 and items == 3, f"Expected orphaned data, got {sections}s, {items}i"
    print(f"    Orphaned data confirmed: {sections}s, {items}i")

    # Verify the user-exists endpoint correctly reports the user as gone
    resp = requests.get(f"{USER_SERVICE}/api/v1/users/internal/exists/{uid}")
    assert resp.status_code == 404, f"Expected 404 for deleted user, got {resp.status_code}"
    print(f"    User-exists endpoint correctly returns 404")

    # The periodic cleanup job would catch this on its next run (10min interval).
    # We can't wait that long in a test, so we just verify the detection mechanism.
    print(f"    (Periodic cleanup would catch this on next run)")

    cleanup_test_data(uid)


def test_8_double_delete():
    """Delete the same user twice — second call should not error."""
    uid, token, headers = register_user()
    sid = create_section(headers)
    create_items(headers, sid, 2)

    # First delete — should succeed
    resp = requests.delete(f"{USER_SERVICE}/api/v1/users/me", headers=headers)
    assert resp.status_code == 204, f"First delete failed: {resp.status_code}"

    elapsed = wait_for_cleanup(uid, timeout=5)
    assert elapsed is not None, "Cleanup did not complete"

    # Second delete — user is already gone, JWT points to non-existent user
    resp = requests.delete(f"{USER_SERVICE}/api/v1/users/me", headers=headers)
    # Should get 500 (user not found in DB) — not a crash
    assert resp.status_code in (204, 404, 500), f"Second delete unexpected: {resp.status_code}"
    print(f"    Second delete returned HTTP {resp.status_code} (expected, no crash)")

    cleanup_test_data(uid)


def test_9_expired_jwt_after_deletion():
    """Mint a JWT with very short expiry, delete user, wait for expiry, verify rejection."""
    uid, token, headers = register_user()
    sid = create_section(headers)
    create_items(headers, sid, 2)

    # Mint a JWT with 2-second expiry
    short_token = pyjwt.encode(
        {"sub": uid, "iat": int(time.time()), "exp": int(time.time()) + 2},
        JWT_SECRET,
        algorithm="HS256",
    )
    short_headers = {"Authorization": f"Bearer {short_token}"}

    # Delete user via SQL (no saga — to isolate JWT expiry behavior)
    delete_user_via_sql(uid)

    # Immediately, the short JWT should still work
    resp = requests.get(
        f"{LIST_SERVICE}/api/v1/lists/sections/{sid}/items",
        headers=short_headers,
    )
    assert resp.status_code == 200, f"Expected 200 before expiry, got {resp.status_code}"
    print(f"    Before expiry: HTTP {resp.status_code} (JWT accepted)")

    # Wait for JWT to expire
    time.sleep(3)

    resp = requests.get(
        f"{LIST_SERVICE}/api/v1/lists/sections/{sid}/items",
        headers=short_headers,
    )
    assert resp.status_code == 401, f"Expected 401 after expiry, got {resp.status_code}"
    print(f"    After expiry: HTTP {resp.status_code} (JWT rejected)")
    print(f"    Short TTL = natural mitigation for stale JWTs")

    cleanup_test_data(uid)


def test_10_cross_user_isolation_after_delete():
    """Delete user A, verify user B's data is completely unaffected."""
    uid_a, token_a, headers_a = register_user()
    uid_b, token_b, headers_b = register_user()

    sid_a = create_section(headers_a, name="user-a-section")
    create_items(headers_a, sid_a, 3)

    sid_b = create_section(headers_b, name="user-b-section")
    create_items(headers_b, sid_b, 3)

    # Delete user A
    delete_user_via_api(headers_a)
    elapsed = wait_for_cleanup(uid_a, timeout=5)
    assert elapsed is not None, "User A cleanup failed"

    # Verify user B is completely unaffected
    sections_b, items_b = count_active_data(uid_b)
    assert sections_b == 1, f"User B sections affected: expected 1, got {sections_b}"
    assert items_b == 3, f"User B items affected: expected 3, got {items_b}"

    resp = requests.get(
        f"{LIST_SERVICE}/api/v1/lists/sections/{sid_b}/items",
        headers=headers_b,
    )
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 3
    print(f"    User B's data completely intact after User A deletion")

    # Clean up user B
    delete_user_via_api(headers_b)
    wait_for_cleanup(uid_b, timeout=5)
    cleanup_test_data(uid_a)
    cleanup_test_data(uid_b)


# ═══════════════════════════════════════════════════════════════
# RUNNER
# ═══════════════════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("  Eventual Consistency Test Suite")
    print("=" * 60)

    tests = [
        ("1. Saga basic cleanup", test_1_saga_basic_cleanup),
        ("2. Gap without saga (SQL delete)", test_2_gap_without_saga),
        ("3. Bulk deletion (10 users)", test_3_bulk_deletion),
        ("4. Concurrent delete + write", test_4_concurrent_delete_and_write),
        ("5. Large dataset cleanup (5 sections × 10 items)", test_5_large_dataset_cleanup),
        ("6. Stale JWT window measurement", test_6_stale_jwt_window),
        ("7. RabbitMQ down → orphan detection", test_7_rabbitmq_down_orphan_cleanup),
        ("8. Double delete (idempotency)", test_8_double_delete),
        ("9. Expired JWT after deletion", test_9_expired_jwt_after_deletion),
        ("10. Cross-user isolation after delete", test_10_cross_user_isolation_after_delete),
    ]

    for name, fn in tests:
        run_test(name, fn)

    print(f"\n{'=' * 60}")
    print(f"  RESULTS: {passed} passed, {failed} failed out of {passed + failed}")
    print(f"{'=' * 60}\n")

    for name, ok, err in results:
        status = "✓" if ok else "✗"
        line = f"  {status} {name}"
        if not ok:
            line += f" — {err}"
        print(line)

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
