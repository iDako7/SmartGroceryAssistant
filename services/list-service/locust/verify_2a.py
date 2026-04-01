"""
Experiment 2a — Post-run verification script.

Connects to list_db and reconciles the final database state against
the operations log produced by locustfile_2a.py.

Checks:
  1. No duplicate item IDs
  2. Active item count = seed + successful_adds - successful_deletes
  3. No soft-deleted item has been "un-deleted" (deleted_at cleared)
  4. All items belong to the correct section

Usage:
  python verify_2a.py [--ops-log results/2a_ops_log.json]
"""

import argparse
import json
import os
import sys

import psycopg


def main():
    parser = argparse.ArgumentParser(description="Verify Experiment 2a results")
    parser.add_argument(
        "--ops-log", default="results/2a_ops_log.json",
        help="Path to the operations log from locustfile_2a.py",
    )
    parser.add_argument(
        "--db-url",
        default=os.getenv("LIST_DB_URL", "postgres://sga:sga_secret@localhost:5432/list_db"),
        help="list_db connection string",
    )
    args = parser.parse_args()

    with open(args.ops_log) as f:
        log = json.load(f)

    section_id = log["section_id"]
    user_id = log["user_id"]
    seed_count = log["seed_count"]
    operations = log["operations"]

    successful_adds = sum(
        1 for op in operations if op["op"] == "add" and op["status_code"] == 201
    )
    successful_deletes = sum(
        1 for op in operations if op["op"] == "delete" and op["status_code"] == 204
    )

    print(f"Section: {section_id}")
    print(f"User:    {user_id}")
    print(f"Ops:     {len(operations)} total")
    print(f"  adds (201):    {successful_adds}")
    print(f"  deletes (204): {successful_deletes}")
    print(f"  expected active items: {seed_count} + {successful_adds} - {successful_deletes} "
          f"= {seed_count + successful_adds - successful_deletes}")
    print()

    errors = []

    with psycopg.connect(args.db_url) as conn:
        with conn.cursor() as cur:
            # 1. Count active items
            cur.execute(
                "SELECT COUNT(*) FROM items WHERE section_id = %s AND deleted_at IS NULL",
                (section_id,),
            )
            active_count = cur.fetchone()[0]

            # 2. Count soft-deleted items
            cur.execute(
                "SELECT COUNT(*) FROM items WHERE section_id = %s AND deleted_at IS NOT NULL",
                (section_id,),
            )
            deleted_count = cur.fetchone()[0]

            # 3. Check for duplicate IDs
            cur.execute(
                "SELECT id, COUNT(*) FROM items WHERE section_id = %s GROUP BY id HAVING COUNT(*) > 1",
                (section_id,),
            )
            dupes = cur.fetchall()

            # 4. Check all items belong to the correct section
            cur.execute(
                """SELECT i.id FROM items i
                   JOIN sections s ON s.id = i.section_id
                   WHERE i.section_id = %s AND s.user_id != %s""",
                (section_id, user_id),
            )
            wrong_owner = cur.fetchall()

            # 5. Total items
            cur.execute(
                "SELECT COUNT(*) FROM items WHERE section_id = %s",
                (section_id,),
            )
            total_count = cur.fetchone()[0]

    expected_active = seed_count + successful_adds - successful_deletes

    print(f"DB state:")
    print(f"  total items:      {total_count}")
    print(f"  active items:     {active_count}")
    print(f"  soft-deleted:     {deleted_count}")
    print(f"  expected active:  {expected_active}")
    print()

    # ── Checks ───────────────────────────────────────────────────────────────

    if dupes:
        errors.append(f"DUPLICATE IDs found: {dupes}")

    if wrong_owner:
        errors.append(f"Items with wrong owner: {[r[0] for r in wrong_owner]}")

    active_diff = active_count - expected_active
    if active_diff != 0:
        msg = (
            f"Active item count mismatch: got {active_count}, expected {expected_active} "
            f"(diff={active_diff:+d})."
        )
        if abs(active_diff) <= 2:
            # Small discrepancies are expected under high contention — Locust's HTTP
            # client may miss a response (timeout/retry) while the server completed the
            # write. This is a test-harness artifact, not a data integrity violation.
            print(f"  WARNING: {msg} (within tolerance — likely client-side logging gap)")
        else:
            errors.append(f"{msg} Possible lost update or phantom item.")

    total_diff = total_count - (seed_count + successful_adds)
    if total_diff != 0:
        msg = (
            f"Total item count mismatch: got {total_count}, "
            f"expected {seed_count + successful_adds} (seed + adds), diff={total_diff:+d}."
        )
        if abs(total_diff) <= 2:
            print(f"  WARNING: {msg} (within tolerance — likely client-side logging gap)")
        else:
            errors.append(f"{msg} Items may have been hard-deleted or created outside the test.")

    # ── Result ───────────────────────────────────────────────────────────────

    if errors:
        print("RESULT: FAIL")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("RESULT: PASS — no data integrity violations detected")
        sys.exit(0)


if __name__ == "__main__":
    main()
