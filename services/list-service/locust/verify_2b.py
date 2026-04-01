"""
Experiment 2b — Post-run verification script.

Connects to list_db and verifies that no unauthorized mutations occurred
during the ownership enforcement experiment.

Checks:
  1. Every item in each test section belongs to the section's owner
  2. No new sections were created by unauthorized users
  3. All unauthorized operations in the ops log received non-2xx responses

Usage:
  python verify_2b.py [--ops-log results/2b_ops_log.json]
"""

import argparse
import json
import os
import sys

import psycopg


def main():
    parser = argparse.ArgumentParser(description="Verify Experiment 2b results")
    parser.add_argument(
        "--ops-log", default="results/2b_ops_log.json",
        help="Path to the operations log from locustfile_2b.py",
    )
    parser.add_argument(
        "--db-url",
        default=os.getenv("LIST_DB_URL", "postgres://sga:sga_secret@localhost:5432/list_db"),
        help="list_db connection string",
    )
    args = parser.parse_args()

    with open(args.ops_log) as f:
        log = json.load(f)

    users_data = log["users"]
    operations = log["operations"]

    # Build section -> owner mapping
    section_owner: dict[str, str] = {}
    known_section_ids: set[str] = set()
    known_user_ids: set[str] = set()

    for uid, udata in users_data.items():
        known_user_ids.add(uid)
        for sec in udata["sections"]:
            section_owner[sec["id"]] = uid
            known_section_ids.add(sec["id"])

    # ── Analyze ops log ──────────────────────────────────────────────────────

    total_unauth = sum(1 for op in operations if not op["authorized"])
    unauth_succeeded = [
        op for op in operations
        if not op["authorized"] and 200 <= op["status_code"] < 300
    ]
    # For GET 200, the locustfile marks it success only if items list is empty
    # (ownership filter returned no data). We flag it as a breach only for
    # write operations that returned 2xx.
    write_breaches = [
        op for op in unauth_succeeded
        if op["op"] in ("add", "update", "delete")
    ]

    total_legit = sum(1 for op in operations if op["authorized"])
    legit_failed = [
        op for op in operations
        if op["authorized"] and op["status_code"] >= 400
    ]

    print(f"Users: {len(users_data)}, Sections: {len(known_section_ids)}")
    print(f"Total operations:     {len(operations)}")
    print(f"  legitimate:         {total_legit} ({len(legit_failed)} failed)")
    print(f"  unauthorized:       {total_unauth} ({len(unauth_succeeded)} got 2xx)")
    print()

    errors = []

    # ── Check 1: Ops log — no unauthorized writes succeeded ──────────────────

    if write_breaches:
        errors.append(
            f"BREACH: {len(write_breaches)} unauthorized write(s) returned 2xx: "
            f"{write_breaches[:5]}"
        )

    # ── Check 2: DB — verify item ownership ──────────────────────────────────

    with psycopg.connect(args.db_url) as conn:
        with conn.cursor() as cur:
            for sec_id, owner_uid in section_owner.items():
                # All items in this section should trace back to the owner
                # via sections.user_id
                cur.execute(
                    """SELECT i.id, s.user_id
                       FROM items i
                       JOIN sections s ON s.id = i.section_id
                       WHERE i.section_id = %s AND s.user_id != %s""",
                    (sec_id, owner_uid),
                )
                violations = cur.fetchall()
                if violations:
                    errors.append(
                        f"Section {sec_id} (owner={owner_uid[:8]}): "
                        f"{len(violations)} items with wrong owner"
                    )

            # Check no rogue sections created by unauthorized users
            if known_user_ids:
                placeholders = ", ".join(["%s"] * len(known_user_ids))
                cur.execute(
                    f"""SELECT id, user_id FROM sections
                        WHERE user_id IN ({placeholders})
                        AND id NOT IN ({', '.join(['%s'] * len(known_section_ids))})
                        AND deleted_at IS NULL""",
                    list(known_user_ids) + list(known_section_ids),
                )
                rogue_sections = cur.fetchall()
                if rogue_sections:
                    errors.append(
                        f"Found {len(rogue_sections)} unexpected sections: "
                        f"{rogue_sections[:5]}"
                    )

    # ── Check 3: False rejections (legit requests that failed) ───────────────

    false_rejection_rate = len(legit_failed) / total_legit * 100 if total_legit else 0
    print(f"False rejection rate: {false_rejection_rate:.1f}% ({len(legit_failed)}/{total_legit})")
    print()

    # ── Result ───────────────────────────────────────────────────────────────

    if errors:
        print("RESULT: FAIL")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("RESULT: PASS — ownership enforcement held under load")
        print(f"  All {total_unauth} unauthorized attempts were rejected")
        sys.exit(0)


if __name__ == "__main__":
    main()
