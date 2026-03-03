# SmartGroceryAssistant — Claude Code Workflow Manual

## Project State

Not yet scaffolded. The repo contains only:
- `CLAUDE.md` — project instructions and architecture reference
- `project_memory/` — artifact, task list, mock data
- `.claude/` — hooks, skills, commands

---

## Development Workflow

This project uses a strict **two-phase TDD cycle** enforced by Claude Code hooks.

### Phase 1 — Write Failing Tests

```
/write-tests <feature>
```

- Creates integration tests in `__tests__/integration/`
- Stops only when all new tests are confirmed **red** (failing)
- No implementation code is written in this phase

### Phase 2 — Implement to Pass Tests

```
/implement <feature>
```

- `__tests__/` is **locked** — edits are rejected by hook
- Write minimum code to make each test pass
- If a test seems wrong, explain why and ask — never modify the test

---

## Feature Build Order

| Phase | Command | Feature |
|-------|---------|---------|
| 1A | `/write-tests Phase 1A` then `/implement Phase 1A` | List Shell — section-based bilingual grocery list |
| 1B | `/write-tests Phase 1B` then `/implement Phase 1B` | Smart Suggest — AI recipe-clustered suggestions |
| 1C | `/write-tests Phase 1C` then `/implement Phase 1C` | Per-Item Education — ⓘ / 🔄 / 💡 panels |
| 1D | `/write-tests Phase 1D` then `/implement Phase 1D` | Onboarding — language, dietary, household prefs |
| 2A | `/write-tests Phase 2A` then `/implement Phase 2A` | API Layer — OpenRouter service |
| 2B–2D | … | Live AI features |

Start with scaffolding, then Phase 1A.

---

## First-Time Setup

Scaffold the project before writing any tests:

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss @tailwindcss/vite
```

Then verify dev server runs:

```bash
npm run dev
```

---

## Active Hooks (automatic enforcement)

| Hook | Blocks |
|------|--------|
| `guard-test-files.sh` | Edits to `__tests__/` during implement phase |
| `enforce-file-naming.sh` | Non-standard file names |
| `guard-npm-install.sh` | Unauthorized `npm install` |
| `guard-git-commit.sh` | Commits when tests are failing |
| `post-write-lint.sh` | ESLint / tsc errors after each file write |
| `stop-check-tests.sh` | Session end without a passing test suite |

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `project_memory/artifact.jsx` | Single-file prototype — behavioral reference for interactions |
| `project_memory/MVP Tasks.md` | User stories and acceptance criteria per phase |
| `project_memory/Mock Data.md` | Pre-stored BBQ with Mark demo scenario data |

---

## Run Commands

```bash
npm run dev        # Vite dev server (390px mobile viewport)
npm test           # Run test suite
npm run build      # Production build
npx tsc --noEmit   # Type check only
```
