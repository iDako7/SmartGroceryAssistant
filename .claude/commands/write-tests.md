---
description: "TDD Phase 1: Write failing integration tests for a feature. Use this to start a new feature by creating tests first (red state)."
allowed-tools: Read, Glob, Grep, Write, Bash
---

You are in TEST WRITING mode.

## Task

Write integration tests for: $ARGUMENTS

## Process

1. Read the feature requirements from `ai-context/MVP Tasks.md` (or the description provided in $ARGUMENTS)
2. Identify all behaviors, interactions, and edge cases to test
3. Write integration test files in `__tests__/integration/`
4. Use `@testing-library/react` + `userEvent` for component interaction testing
5. Run `npm test` and confirm ALL new tests FAIL (red state)

## Test file structure

Each integration test must:

1. Render `<App />` and identify the initial DOM state
2. Simulate user interactions via `userEvent`
3. Assert the resulting DOM state matches expected behavior

```typescript
describe('Feature: [feature name]', () => {
  function setup() {
    const user = userEvent.setup();
    const utils = render(<App />);
    return { user, ...utils };
  }

  it('should [expected behavior] when [condition]', async () => {
    const { user } = setup();
    // 1. Arrange: identify initial DOM state
    // 2. Act: simulate user interaction
    // 3. Assert: check DOM output
  });
});
```

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
