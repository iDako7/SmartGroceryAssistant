# Claude Code Config Guide

A beginner's guide to how this project controls Claude's behavior using hooks, skills, commands, and settings.

---

## The Big Picture

Claude Code is configurable. You can teach it rules, give it custom commands, and set up automatic checks that run before or after it does things. This project uses all of these to enforce a strict **Test-Driven Development (TDD)** workflow.

Everything lives inside the `.claude/` folder:

```
.claude/
├── settings.local.json     ← Permissions + hook wiring
├── hooks/                  ← Shell scripts that enforce rules automatically
│   ├── guard-test-files.sh
│   ├── enforce-file-naming.sh
│   ├── guard-npm-install.sh
│   ├── guard-git-commit.sh
│   ├── post-write-lint.sh
│   └── stop-check-tests.sh
├── commands/               ← Custom slash commands (/write-tests, /implement)
│   ├── write-tests.md
│   └── implement.md
└── skills/                 ← Reusable instruction sets Claude can load
    └── tdd-workflow/
        └── SKILL.md
```

---

## Part 1: Hooks

### What is a hook?

A hook is a shell script that Claude runs **automatically** at key moments — before it edits a file, after it writes a file, or when it's about to stop. You don't need to ask Claude to run them; they fire on their own.

Think of hooks as guardrails: they catch problems before they happen.

### How hooks are wired

Hooks are registered in `settings.local.json`. The structure is:

```json
"hooks": {
  "PreToolUse": [...],   ← runs BEFORE Claude uses a tool
  "PostToolUse": [...],  ← runs AFTER Claude uses a tool
  "Stop": [...]          ← runs when Claude is about to finish responding
}
```

Each entry specifies:
- **`matcher`** — which tool to intercept (e.g., `Edit|Write`, `Bash`)
- **`command`** — the shell script to run
- **`timeout`** — seconds before the hook is force-killed

### How a hook stops Claude

Exit codes control what happens:
- `exit 0` → allow Claude to proceed
- `exit 2` → **block** Claude's action and show an error message

The error message is written to `stderr` (the `echo "..." >&2` lines in the scripts).

---

### Hook-by-hook breakdown

#### `guard-test-files.sh` — Test file lock

**When it runs:** Before every `Edit` or `Write` tool call.

**What it does:** If the environment variable `CLAUDE_TDD_MODE=implement` is set, it checks whether the file Claude is trying to edit is a test file. If yes, it blocks the edit.

```bash
if [ "$CLAUDE_TDD_MODE" = "implement" ]; then
    if echo "$FILE_PATH" | grep -qE "(/__tests__/|\.test\.(ts|tsx)$)"; then
        echo "BLOCKED: Test files are read-only..." >&2
        exit 2   # ← blocks Claude
    fi
fi
```

**Why it exists:** During the implement phase, Claude should never fix a failing test by editing the test itself. It must fix the implementation code instead.

---

#### `enforce-file-naming.sh` — File naming convention

**When it runs:** Before every `Edit` or `Write` tool call.

**What it does:** Checks that any TypeScript file in `src/` follows the naming conventions:

| Folder | Required name format | Example |
|--------|---------------------|---------|
| `src/controller/` | `{Name}Controller.ts` | `GroceryController.ts` |
| `src/services/` | `{Name}Service.ts` | `SuggestService.ts` |
| `src/repositories/` | `{Name}Repository.ts` | `ItemRepository.ts` |
| `src/routes/` | `{name}.routes.ts` | `grocery.routes.ts` |
| `src/dtos/response/` | `{Name}DTO.ts` | `SuggestResponseDTO.ts` |

If the name doesn't match, it blocks the file creation and tells Claude the correct format.

**Why it exists:** Consistent naming makes the codebase predictable and searchable. Claude won't silently create `groceryService.ts` (wrong case) when it should be `GroceryService.ts`.

---

#### `guard-npm-install.sh` — Package install guard

**When it runs:** Before every `Bash` tool call.

**What it does:** Blocks `npm install <package>` unless:
- No package name is given (restoring `node_modules` from lockfile is fine)
- The package is a `@types/` package
- The environment variable `CLAUDE_ALLOW_INSTALL=true` is set

**Why it exists:** Prevents Claude from silently adding dependencies that weren't approved. Keeps `package.json` clean and intentional.

---

#### `guard-git-commit.sh` — Commit gate

**When it runs:** Before any `Bash` call that contains `git commit`.

**What it does:** Runs `npm test` first. If tests fail, it blocks the commit and shows the failing tests.

**Why it exists:** Ensures the repo is never committed in a broken state. The commit only goes through if the full test suite is green.

---

#### `post-write-lint.sh` — TypeScript type check

**When it runs:** After every `Write` tool call (when Claude creates a new file).

**What it does:** Runs `npx tsc --noEmit` to check for TypeScript type errors in the newly written file. If errors are found, it sends a `block` decision back to Claude with the error details.

**Why it exists:** Catches type errors immediately after a file is created, so Claude can fix them right away instead of discovering them later.

---

#### `stop-check-tests.sh` — Finish gate

**When it runs:** When Claude is about to stop responding (the `Stop` event).

**What it does:** In `CLAUDE_TDD_MODE=implement`, it runs `npm test`. If any tests are still failing, it sends a signal telling Claude to keep going instead of stopping.

**Why it exists:** Prevents Claude from declaring "done" when tests are still red. It won't stop until everything passes.

---

## Part 2: Commands (Slash Commands)

### What is a command?

A command is a **custom slash command** you type to trigger a specific workflow. In this project:

```
/write-tests <feature description>
/implement <feature description>
```

Commands live in `.claude/commands/` as `.md` files. Each file is a prompt template that Claude executes when you invoke the command.

### How a command file works

```markdown
---
description: "Short description shown in the command picker"
allowed-tools: Read, Glob, Grep, Write, Bash
---

You are in TEST WRITING mode.

## Task
Write integration tests for: $ARGUMENTS
...
```

- The `---` block at the top is **frontmatter** — metadata about the command
- `$ARGUMENTS` is replaced with whatever you type after the command name
- `allowed-tools` limits which tools Claude can use during this command (safety constraint)
- The rest is a prompt that tells Claude exactly what to do and how

### `write-tests.md` — Phase 1

Tells Claude to:
1. Read feature requirements
2. Write test files in `__tests__/integration/`
3. Run `npm test` and confirm all new tests **fail**
4. Stop — no implementation code allowed

The `allowed-tools` intentionally excludes `Edit` (editing existing files is blocked in this phase).

### `implement.md` — Phase 2

Tells Claude to:
1. Run `npm test` to see current failures
2. Read the failing tests to understand what's needed
3. Write minimum code to make each test pass
4. Follow the Repository → Service → Controller layering
5. Never touch `__tests__/` files

The `guard-test-files.sh` hook enforces the "never touch test files" rule automatically.

---

## Part 3: Skills

### What is a skill?

A skill is a **reusable instruction set** that Claude can be told to follow. Unlike commands (which you invoke once), skills are referenced by Claude whenever it encounters a relevant situation.

Skills live in `.claude/skills/{name}/SKILL.md`.

### How skills are triggered

In the `CLAUDE.md` file (the main project instructions), you can reference a skill by name. The system prompt tells Claude: *"Consult the tdd-workflow skill whenever writing tests, implementing features, or working with `__tests__/`."*

This means Claude loads the skill's rules into its context automatically for relevant tasks — you don't need to invoke it manually.

### `tdd-workflow/SKILL.md`

This skill contains:
- A summary of both TDD phases
- **File placement reference table** — where each type of file should live
- **Dependency injection rule** — all `new X()` calls happen only in `app.ts`
- **Test structure template** — the exact format every test should follow

Think of it as Claude's cheat sheet that it consults before making decisions about file structure.

---

## Part 4: Settings (`settings.local.json`)

### What it controls

Two things:

**1. Permissions** — what Claude is allowed to do without asking you:

```json
"permissions": {
  "allow": [
    "Bash(npm create:*)",
    "Bash(rm:*)",
    "Bash(ls:*)"
  ]
}
```

These are pre-approved commands that don't trigger a confirmation prompt. Anything not on this list requires your approval.

**2. Hook wiring** — which scripts run at which events (covered in Part 1 above).

### `settings.local.json` vs `settings.json`

- `settings.local.json` — applies only to this machine, not committed to git (private)
- `settings.json` — committed to the repo, applies to everyone who clones it

This project uses `settings.local.json` because the hooks use absolute paths (`$CLAUDE_PROJECT_DIR`) that work on any machine anyway.

---

## Part 5: How to Add a New Skill or Command

### Adding a new slash command

1. Create a file: `.claude/commands/your-command-name.md`
2. Write the frontmatter and prompt:

```markdown
---
description: "What this command does (shown in /help)"
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

You are in [MODE NAME] mode.

## Task
Do this thing for: $ARGUMENTS

## Process
1. Step one
2. Step two
3. ...

## Constraints
- Rule 1
- Rule 2
```

3. Use it: `/your-command-name some arguments`

**Tips:**
- Be explicit about what Claude should and shouldn't do
- Include an "Output" section so Claude knows what to report when done
- Restrict `allowed-tools` to only what's needed — this prevents Claude from doing things outside the command's scope

---

### Adding a new skill

1. Create the folder and file: `.claude/skills/your-skill-name/SKILL.md`
2. Write the skill content (rules, tables, templates — whatever Claude needs to consult)
3. Reference it in `CLAUDE.md` by adding an instruction like:

```markdown
Consult the `your-skill-name` skill whenever you are doing X.
```

**When to use a skill vs. a command:**
- **Skill** → ongoing rules Claude applies repeatedly across many tasks (e.g., always follow these architecture patterns)
- **Command** → a one-time workflow you invoke explicitly (e.g., run TDD phase 1 for this feature)

---

### Adding a new hook

1. Create the script: `.claude/hooks/your-hook.sh`
2. Make it executable: `chmod +x .claude/hooks/your-hook.sh`
3. Wire it in `settings.local.json`:

```json
{
  "matcher": "Edit|Write",
  "hooks": [{
    "type": "command",
    "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/your-hook.sh",
    "timeout": 10
  }]
}
```

4. In your script, read the tool input from stdin as JSON and use `exit 2` to block:

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(data.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null)

# Your check here
if [ some_condition ]; then
    echo "BLOCKED: Reason here" >&2
    exit 2
fi

exit 0
```

**Hook event reference:**

| Event | Matcher options | When it fires |
|-------|----------------|---------------|
| `PreToolUse` | `Edit`, `Write`, `Bash`, `Read`, etc. | Before Claude uses the tool |
| `PostToolUse` | Same as above | After Claude uses the tool |
| `Stop` | (no matcher needed) | When Claude finishes responding |

---

## Summary: The Full TDD Enforcement Chain

Here's how all the pieces work together for one feature:

```
You type: /write-tests "add item to grocery list"
    ↓
write-tests.md command loads → Claude enters test-writing mode
    ↓
Claude writes test files in __tests__/integration/
    ↓
enforce-file-naming.sh checks naming on every Write
    ↓
Claude runs npm test → confirms tests are RED
    ↓
You type: /implement "add item to grocery list"
    ↓
implement.md command loads → CLAUDE_TDD_MODE=implement is set
    ↓
Claude writes implementation files
    ↓
guard-test-files.sh blocks any attempt to edit __tests__/
enforce-file-naming.sh enforces src/ naming on every Write
post-write-lint.sh runs tsc after every new file
    ↓
Claude tries to git commit
guard-git-commit.sh runs npm test first → blocks if red
    ↓
Claude tries to stop
stop-check-tests.sh runs npm test → blocks if still red
    ↓
All tests GREEN → commit allowed → Claude stops
```
