# TDD Workflow Guide for SmartGroceryAssistant

Extracted from [everything-claude-code](https://github.com/affaan-m/everything-claude-code). Covers how to use it, how it works internally, and how to maintain it.

Source analysis date: 2026-03-20

---

## Quick Start

Open Claude Code in this project directory and type any of these:

```
/plan           Plan before coding (uses opus model)
/tdd            Write tests first, then implement
/build-fix      Fix build/type errors one at a time
/code-review    Security + quality review of uncommitted changes
/test-coverage  Find coverage gaps, generate missing tests
/e2e            Generate Playwright E2E tests
/verify         Final check: build + types + lint + tests + git
```

**Recommended workflow order:**

```
/plan  →  /tdd  →  /build-fix (if needed)  →  /code-review  →  /test-coverage  →  /e2e  →  /verify
```

Each command is independent. You type them manually when ready — there is no automatic chaining.

---

## What's Installed (17 files)

```
.claude/
├── commands/                  (7 slash commands — the entry points)
│   ├── plan.md                  /plan  → spawns planner agent (opus)
│   ├── tdd.md                   /tdd   → spawns tdd-guide agent (sonnet)
│   ├── build-fix.md             /build-fix → spawns build-error-resolver (sonnet)
│   ├── code-review.md           /code-review → spawns code-reviewer (sonnet)
│   ├── test-coverage.md         /test-coverage → inline (no agent)
│   ├── e2e.md                   /e2e → spawns e2e-runner (sonnet)
│   └── verify.md                /verify → uses verification-loop skill
├── agents/                    (5 subagent definitions)
│   ├── planner.md               System design, risk assessment
│   ├── tdd-guide.md             RED → GREEN → REFACTOR enforcement
│   ├── build-error-resolver.md  Minimal-diff error fixing
│   ├── code-reviewer.md         Security + quality checklist
│   └── e2e-runner.md            Playwright test generation
└── skills/                    (5 knowledge documents — passive context)
    ├── tdd-workflow/SKILL.md    Test patterns, mocking, coverage thresholds
    ├── backend-patterns/SKILL.md  API design, repo pattern, caching, auth
    ├── coding-standards/SKILL.md  Naming, file size, immutability rules
    ├── e2e-testing/SKILL.md     Page Object Model, flaky test strategies
    └── verification-loop/SKILL.md  Multi-step verification checklist
```

---

## How It Works Internally

### The Three Layers

```
COMMANDS  (commands/*.md)    You invoke via /tdd, /plan, etc.
    │                        Prompt templates injected into Claude's context.
    ▼
AGENTS   (agents/*.md)       Claude spawns these as subagents.
    │                        YAML frontmatter = config (name, tools, model).
    │                        Markdown body = the subagent's system prompt.
    ▼
SKILLS   (skills/*/SKILL.md) Passive knowledge documents.
                             Auto-loaded into context at session start.
                             NOT "imported" — always present in background.
```

**There is no code, no imports, no runtime wiring.** The entire system is markdown files placed in directories that Claude Code auto-scans.

### How Skills Connect to Agents

The `tdd-guide.md` agent says on line 80:

> "For detailed mocking patterns, see `skill: tdd-workflow`."

This is **not an import**. It's a natural language hint. The skill `tdd-workflow/SKILL.md` is already loaded into Claude's context because Claude Code auto-scans `.claude/skills/` at session start. The agent just points Claude's attention at knowledge that's already there.

### The Loading Mechanism

```
SESSION START (Anthropic's closed-source Claude Code CLI):
  Claude Code auto-scans .claude/skills/  → loads all SKILL.md into context
  Claude Code auto-scans .claude/commands/ → registers slash commands
  Claude Code auto-scans .claude/agents/   → registers available subagents

USER TYPES /tdd:
  Claude Code finds commands/tdd.md → injects into prompt
  Claude reads "invokes the tdd-guide agent" → spawns subagent
  tdd-workflow skill is ALREADY in context (loaded at session start)
  tdd-guide agent runs with full TDD knowledge
```

The auto-scanning behavior is built into Claude Code by Anthropic. The ECC repo just places files where Claude Code expects them.

---

## TDD Hierarchy Map

When you type `/tdd`, here's exactly what gets activated:

```
/tdd  (you type this)
 │
 │  commands/tdd.md  (injected into prompt)
 │    Directly references:
 │      → 1 agent:  tdd-guide
 │      → 6 sibling commands: /plan, /build-fix, /code-review,
 │                             /test-coverage, /e2e, /verify
 │
 ▼
 AGENT: tdd-guide  (model: sonnet)
 │  tools: Read, Write, Edit, Bash, Grep
 │  References: skill: tdd-workflow
 │
 ▼
 SKILL: tdd-workflow  (passive knowledge, already in context)
   Contains: unit test patterns, integration test patterns,
   E2E patterns, mocking (Supabase/Redis/OpenAI),
   coverage thresholds, file organization
```

| What | Count | Names |
|------|-------|-------|
| Agents directly used | 1 | tdd-guide |
| Skills directly used | 1 | tdd-workflow |
| Sibling commands suggested | 6 | /plan, /build-fix, /code-review, /test-coverage, /e2e, /verify |
| Agents reachable via siblings | 3 | planner, build-error-resolver, e2e-runner, code-reviewer |

The TDD command itself is simple: **1 command, 1 agent, 1 skill**. The sibling commands are just "see also" suggestions — not auto-invoked.

---

## TDD Step-by-Step: What the Agent Actually Does

When you type `/tdd I need a user authentication service`:

```
① Claude Code finds .claude/commands/tdd.md
   Injects content into prompt.
   Skill tdd-workflow/SKILL.md is ALREADY loaded.

② Claude reads the command → spawns tdd-guide agent
   Agent(name="tdd-guide", tools=["Read","Write","Edit","Bash","Grep"], model="sonnet")

③ tdd-guide runs the RED-GREEN-REFACTOR cycle:

   STEP 1: SCAFFOLD — Define interfaces
   ─────────────────────────────────────
   Agent uses Write tool to create:
     lib/auth.ts  (interface + stub that throws "Not implemented")

   STEP 2: RED — Write failing tests
   ──────────────────────────────────
   Agent uses Write tool to create:
     lib/auth.test.ts
       it('returns token for valid credentials')
       it('throws for invalid password')
       it('throws for non-existent user')
       it('verifies valid token')
       it('rejects expired token')

   STEP 3: RUN TESTS — Verify they FAIL
   ─────────────────────────────────────
   Agent uses Bash tool:
     $ npm test lib/auth.test.ts
     Output: FAIL  5 tests failed
     Agent confirms: "Tests fail as expected"

   STEP 4: GREEN — Write minimal implementation
   ─────────────────────────────────────────────
   Agent uses Edit tool to fill in auth.ts:
     Just enough code to pass tests. No extras.

   STEP 5: RUN TESTS — Verify they PASS
   ─────────────────────────────────────
   Agent uses Bash tool:
     $ npm test lib/auth.test.ts
     Output: PASS  5 tests passed

   STEP 6: REFACTOR — Improve code
   ────────────────────────────────
   Agent uses Edit tool:
     Extract constants, improve naming, remove duplication.
     Runs tests after each change to ensure they stay green.

   STEP 7: COVERAGE CHECK
   ──────────────────────
   Agent uses Bash tool:
     $ npm test -- --coverage lib/auth.test.ts
     If < 80%: goes back to STEP 2 (write more tests)
     If >= 80%: "TDD session complete!"
```

The **skill** provides the knowledge (mocking patterns, file organization, Playwright examples).
The **agent** provides the behavior (the loop, the 80% threshold, the decision to run tests).

---

## Full Software Development Workflow Map

All 7 installed commands mapped to development phases:

```
PHASE 1: PLANNING
  /plan ──────► planner agent (opus)
                "What are we building? What are the risks?"
                BLOCKS until you confirm the plan.

PHASE 2: IMPLEMENTATION (TDD)
  /tdd ───────► tdd-guide agent (sonnet) + tdd-workflow skill
                RED → GREEN → REFACTOR cycle.
                Targets 80%+ coverage.

PHASE 3: BUILD FIXING (if needed)
  /build-fix ─► build-error-resolver agent (sonnet)
                Fix one error at a time, minimal diffs.

PHASE 4: CODE REVIEW
  /code-review► code-reviewer agent (sonnet)
                Security (CRITICAL) → Quality (HIGH) →
                Performance (MEDIUM) → Best Practices (LOW)

PHASE 5: COVERAGE
  /test-coverage (inline, no agent)
                Find gaps, generate missing tests to reach 80%+.

PHASE 6: E2E TESTING
  /e2e ───────► e2e-runner agent (sonnet) + e2e-testing skill
                Generate Playwright tests for user flows.

PHASE 7: VERIFICATION
  /verify ────► verification-loop skill
                Build + Types + Lint + Tests + Git status
```

---

## How to Add or Remove Commands

### Adding a new command from ECC

Each command needs 1-3 files. Example for `/refactor-clean`:

```bash
ECC="/path/to/everything-claude-code"

cp "$ECC/commands/refactor-clean.md"    .claude/commands/
cp "$ECC/agents/refactor-cleaner.md"    .claude/agents/
# No skill needed for this one
```

### Removing a command

Just delete the files:

```bash
rm .claude/commands/e2e.md
rm .claude/agents/e2e-runner.md
rm -rf .claude/skills/e2e-testing/
```

### What NOT to copy from ECC

- `scripts/` — installer plumbing for multi-IDE distribution
- `manifests/` — module resolution for selective install
- `.agents/` — OpenAI Codex compatibility copies
- `.claude/ecc-tools.json` — package manager metadata
- `hooks/` — optional, only if you want automation triggers
- `rules/` — optional, only for language-specific linting rules

You don't need any of these for Claude Code terminal usage. Just copy the markdown files directly.

---

## Origin

Cherry-picked from [everything-claude-code v1.9.0](https://github.com/affaan-m/everything-claude-code) (MIT license).

Only the workflow chain `/plan → /tdd → /build-fix → /code-review → /test-coverage → /e2e → /verify` was extracted. The full repo contains 59 commands, 28 agents, and 116 skills.
