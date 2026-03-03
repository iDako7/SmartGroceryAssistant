# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Grocery Assistant is an AI-powered grocery shopping assistant in early prototype stage. It is modeled after Apple Reminders' Groceries list. Users maintain section-based grocery lists, get AI-powered recipe-clustered suggestions, and learn about products through per-item education panels. The target audience is investors, HR, and CS students (demo prototype).

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS v4
- **AI:** OpenRouter API (`anthropic/claude-sonnet-4-20250514`) via `VITE_OPENROUTER_API_KEY`
- **Target viewport:** 390px mobile (presented in browser responsive mode)
- **State:** No persistence — state resets on refresh by design (demo starts from known state)

## Commands

The project has not yet been scaffolded. Once `package.json` exists, the expected commands are:

```bash
npm run dev        # Vite dev server
npm test           # Run test suite
npm run build      # Production build
npx tsc --noEmit   # TypeScript type check
```

## TDD Workflow

This project uses a strict two-phase TDD workflow enforced by Claude Code hooks (`.claude/hooks/`):

**Phase 1 — Write tests first:**
```
/project:write-tests <feature>
```
- Writes failing integration tests into `__tests__/integration/`
- Confirms all new tests are in red state before stopping
- Test files ONLY — no implementation code

**Phase 2 — Implement to pass tests:**
```
/project:implement <feature>
```
- Test files are locked by `guard-test-files.sh` — edits to `__tests__/` are rejected
- Implement minimum code to pass each test
- Never modify test files; if a test seems wrong, explain why and let the user decide

**Active hooks:**
- `PreToolUse[Edit|Write]`: `guard-test-files.sh` — blocks edits to test files during implement phase
- `PreToolUse[Edit|Write]`: `enforce-file-naming.sh` — enforces file naming conventions
- `PreToolUse[Bash]`: `guard-npm-install.sh` — blocks unauthorized package installs
- `PreToolUse[Bash]`: `guard-git-commit.sh` — runs tests before allowing commits
- `PostToolUse[Write]`: `post-write-lint.sh` — runs ESLint/tsc after each file write
- `Stop`: `stop-check-tests.sh` — verifies test suite on session end

## Architecture

### Layering (once scaffolded)
```
Repository (Prisma/data access) → Service (business logic) → Controller (HTTP) → Routes
```
- `app.ts` is the ONLY place where `new Repository()`, `new Service()`, `new Controller()` appear (constructor injection)
- Services throw typed errors extending `AppError` — controllers have NO try/catch
- List endpoints support pagination: `page`, `limit` → `{ data, pagination }`

### Key Type Definitions
```typescript
UserProfile    // language, dietary[], householdSize, tastePrefs
GroceryItem    // id, nameEn, nameSecondary, quantity, checked, isSuggestion
Section        // id, name, items[], activeView ('flat'|'smart'|'aisles')
SuggestResponse   // contextSummary, clusters[], aisleLayout[]
InspireResponse, AlternativesResponse, ItemInfoResponse  // education panels
```

### Feature Phases
| Phase | Feature | Description |
|-------|---------|-------------|
| 1A | List Shell | Section-based bilingual grocery list with CRUD |
| 1B | Smart Suggest | AI recipe-clustered suggestions with Quick Questions |
| 1C | Per-Item Education | ⓘ Info / 🔄 Alternatives / 💡 Inspire panels per item |
| 1D | Onboarding | Language + dietary + household + taste prefs setup |
| 2A | API Layer | OpenRouter service layer with typed responses |
| 2B | Live Suggest | Real AI-generated recipe clusters |
| 2C | Live Education | Real AI content for education panels |
| 2D | Auto-Translation | Item name auto-translates to bilingual display |

### Explicitly Out of Scope
Offline/sync, multi-device, auth, localStorage, drag-and-drop, backend/database, US-9 (Regenerate), US-15–18.

## Reference Files

- `project_memory/artifact.jsx` — Complete single-file React prototype. Use as **behavioral reference** for interactions and data flow, but build as a proper multi-file project.
- `project_memory/MVP Tasks.md` — Full user stories and acceptance criteria per phase.
- `project_memory/Mock Data.md` — Pre-stored BBQ with Mark demo scenario data.

## Design System

**Aesthetic:** Warm, inviting, minimal. NOT cold or clinical.

| Token | Value | Usage |
|-------|-------|-------|
| Primary | Muted forest green (`#2E7D32`) | Section headers, CTAs, checkmarks |
| Accent | Warm terracotta (`#FF6B35`) | Suggest button, "NEW" badges, suggestion highlights |
| Background | Warm off-white (`#F7F6F3`) | App background |
| Suggestion bg | Warm tinted + dashed border | Suggestion item cards |

**Typography:** Serif for app title "Smart Grocery"; system sans-serif everywhere else. CJK-aware font stack for Chinese text.

**Key UI patterns:**
- View tabs (Flat / Smart / Aisles) appear inside each section card, ONLY after Suggest has been run on that section
- Smart view: recipe clusters with emoji headers, existing items normal, suggestions show sparkle prefix + reason + Keep/Dismiss
- Aisles view: grouped by store department, suggestions show "NEW" badge instead of quantity
- Flat view: full CRUD controls (ⓘ, 🔄, quantity, 💡, ✏️, 🗑️); Smart/Aisles views show only ⓘ and 🔄
- Education icons appear on all views
