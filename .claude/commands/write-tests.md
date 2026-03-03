---
description: "TDD Phase 1: Write failing integration tests for a feature. Use this to start a new feature by creating tests first (red state)."
allowed-tools: Read, Glob, Grep, Write, Bash
---

You are in TEST WRITING mode.

## Task

Write integration tests for: $ARGUMENTS

## Process

1. Read the feature requirements from TASKS.md (or the description provided in $ARGUMENTS)
2. Identify all endpoints, behaviors, and edge cases to test
3. Write integration test files in `__tests__/integration/`
4. Use Supertest for HTTP request → response testing
5. Run `npm test` and confirm ALL new tests FAIL (red state)

## Test file structure

Each integration test must:

1. Set up test data (create user, create module/concept/quiz as needed)
2. Make HTTP request via Supertest
3. Assert response status + body shape
4. Assert database state changed correctly (query DB to verify)
5. Clean up test data in afterEach/afterAll

## Constraints

- Write test files ONLY — no implementation code
- Do NOT modify any files outside `__tests__/`
- Do NOT modify existing test files unless extending them for the current feature
- Test assertions come from the functional requirements, not from guessing implementation details
- Use descriptive test names: `should [expected behavior] when [condition]`

## Output

After writing tests, run `npm test` and report:
- List of test files created
- Summary of each test case
- Confirmation that all new tests fail with expected reasons
