# .claude/ Config Reference

```
.claude/
├── settings.json                        # Hook wiring — all PreToolUse, PostToolUse, Stop hooks
├── commands/
│   ├── write-tests.md                   # /project:write-tests — TDD Phase 1 (red)
│   └── implement.md                     # /project:implement  — TDD Phase 2 (green)
├── hooks/
│   ├── guard-test-files.sh              # Blocks edits to __tests__/ when CLAUDE_TDD_MODE=implement
│   ├── enforce-file-naming.sh           # Blocks files that violate naming conventions
│   ├── guard-npm-install.sh             # Blocks npm/yarn/pnpm add unless CLAUDE_ALLOW_INSTALL=true
│   ├── guard-git-commit.sh              # Runs npm test before git commit, blocks on failure
│   ├── post-write-lint.sh               # Runs tsc --noEmit after .ts file writes, feeds errors back
│   └── stop-check-tests.sh             # Prevents Claude from stopping if tests still fail (implement mode)
└── skills/
    └── tdd-workflow/
        └── SKILL.md                     # Auto-triggered reference: TDD rules, file placement, test template
```

## Environment Variables

| Variable | Values | Effect |
|----------|--------|--------|
| `CLAUDE_TDD_MODE` | `implement` / unset | When `implement`, test files are read-only |
| `CLAUDE_ALLOW_INSTALL` | `true` / unset | When `true`, npm install is allowed |

## Usage

```bash
# Phase 1: write tests
claude
> /project:write-tests [feature description]

# Phase 2: implement
CLAUDE_TDD_MODE=implement claude
> /project:implement [feature description]
```
