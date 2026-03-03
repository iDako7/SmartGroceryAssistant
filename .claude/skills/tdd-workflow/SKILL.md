---
name: tdd-workflow
description: "Enforces test-driven development workflow rules. Consult this skill whenever writing tests, implementing features, or working with the __tests__/ directory. Also consult when Claude needs to decide whether to modify a test file or an implementation file. This skill applies to all test-related and implementation tasks."
---

# TDD Workflow Rules

This project uses strict two-phase TDD. The phases are enforced by hooks and slash commands.

## Phase 1: Write Tests (red state)

Invoked by: `/project:write-tests [feature description]`

In this phase:
- Create test files in `__tests__/integration/`
- Use Supertest for HTTP testing against a real test database
- Cover happy paths, error cases, auth checks, pagination, and edge cases
- Do not write any implementation code
- End state: all new tests FAIL

## Phase 2: Implement (green state)

Invoked by: `/project:implement [feature description]`
Requires: `CLAUDE_TDD_MODE=implement` environment variable

In this phase:
- Read failing tests to understand expected behavior
- Write minimum implementation to pass tests
- Files in `__tests__/` are blocked by a PreToolUse hook — do not attempt to edit them
- Follow Repository → Service → Controller architecture
- End state: all tests PASS

## When to consult this skill

- Before creating any file in `__tests__/`: check which phase you are in
- Before modifying any test file: this is only allowed in Phase 1
- When a test fails during implementation: fix the implementation, not the test
- When deciding where to put new code: follow the file naming conventions below

## File placement reference

| Type | Path pattern | Naming |
|------|-------------|--------|
| Integration test | `__tests__/integration/{feature}.test.ts` | kebab-case |
| Unit test | `__tests__/unit/{feature}.test.ts` | kebab-case |
| Controller | `src/controller/{Name}Controller.ts` | PascalCase |
| Service | `src/services/{Name}Service.ts` | PascalCase |
| Repository | `src/repositories/{Name}Repository.ts` | PascalCase |
| Route | `src/routes/{name}.routes.ts` | camelCase |
| DTO | `src/dtos/response/{Name}DTO.ts` | PascalCase |
| Constant | `src/constants/{name}.ts` | camelCase |
| Validation | `src/validation/{name}Validation.ts` | camelCase |

## Dependency injection rule

All instantiation happens in `app.ts`. Services receive their dependencies through constructor parameters. Never import and instantiate a repository or service inside another service file.

## Test structure template

```typescript
describe('Feature: [feature name]', () => {
  beforeAll(async () => { /* DB setup, create test users */ });
  afterAll(async () => { /* cleanup */ });

  describe('POST /api/[resource]', () => {
    it('should [expected behavior] when [condition]', async () => {
      // 1. Arrange: set up test data
      // 2. Act: make HTTP request via supertest
      // 3. Assert: check response status + body
      // 4. Assert: verify DB state changed
    });
  });
});
```
