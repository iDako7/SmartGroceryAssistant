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

- Components (`src/components/`): UI rendering and local state only — receive props and callbacks, no inline mock data
- Hooks (`src/hooks/`): encapsulate reusable stateful logic (e.g., `useEducationPanel`)
- Services (`src/services/`): return typed mock data (Phase 1) or real API responses (Phase 2) — no UI concerns
- `App.tsx`: composes top-level state and passes callbacks to child components — no inline mock data

## Constraints

- NEVER modify files in `__tests__/` — a hook blocks this and your edit will be rejected
- Do NOT add npm packages unless the task explicitly requires it
- Keep components focused — no 300+ line components
- Mock data lives in `src/mock/` — never inlined in components or `App.tsx`
- Service functions return typed data matching types in `ai-context/MVP Tasks.md`

## If a test seems wrong

Explain why you think the test is incorrect and what behavior you expected. Do NOT attempt to modify the test. The user will decide whether to adjust the test in a separate session.

## Output

Run `npm test` one final time and report:
- Confirmation all tests pass
- List of files created or modified
- Any concerns about test correctness (if applicable)
