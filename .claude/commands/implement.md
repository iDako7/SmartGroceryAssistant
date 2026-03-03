---
description: "TDD Phase 2: Implement code to make all failing tests pass. Test files are locked by a hook and cannot be modified."
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

You are in IMPLEMENTATION mode.

## Task

Make all failing tests pass for: $ARGUMENTS

## Process

1. Run `npm test` to see current failures
2. Read the failing test files to understand expected behavior
3. Implement the minimum code needed to pass each test
4. Follow Repository → Service → Controller layering
5. Wire all new dependencies in `app.ts` via constructor injection
6. Run `npm test` after each meaningful change
7. Repeat until ALL tests pass

## Architecture rules

- Repository: data access only, Prisma queries, no business logic
- Service: business logic, receives repositories/services via constructor injection
- Controller: HTTP concerns only, parse request → call service → format response
- Routes: map HTTP methods/paths to controller methods, apply middleware
- app.ts: the ONLY place where `new Repository()`, `new Service()`, `new Controller()` appear

## Constraints

- NEVER modify files in `__tests__/` — a hook blocks this and your edit will be rejected
- Use Prisma `select` over `include` — only fetch fields needed
- Use Prisma `groupBy` + `_count`/`_avg` for aggregation — no N+1 queries
- All list endpoints must support pagination (`page`, `limit` → `{ data, pagination }`)
- Services throw typed errors extending AppError — controllers have NO try/catch
- Do NOT add npm packages unless the task explicitly requires it
- Do NOT create new architectural patterns — follow existing codebase patterns

## If a test seems wrong

Explain why you think the test is incorrect and what behavior you expected. Do NOT attempt to modify the test. The user will decide whether to adjust the test in a separate session.

## Output

Run `npm test` one final time and report:
- Confirmation all tests pass
- List of files created or modified
- Any concerns about test correctness (if applicable)
