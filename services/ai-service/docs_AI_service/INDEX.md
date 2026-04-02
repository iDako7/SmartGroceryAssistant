# AI Service Documentation Index

Living index for the AI Service rewrite. Use this page to find the current source of truth, working notes, and historical context.

## Start Here

| Document | Description |
| -------- | ----------- |
| [Phased Plan](phased_plan.md) | Primary roadmap for the rewrite: architecture, phase goals, scope, and exit criteria |
| [Open Questions](open_questions.md) | Active decisions and research items that still need resolution |
| [Phase 2 Implementation Plan](phase_plan/phase2_implementation_plan.md) | Step-by-step TDD implementation plan for remaining sync endpoints |
| [Phase 2 Walkthrough](phase_plan/phase2_walkthrough.md) | Narrative explanation of the Phase 2 architecture and request flow |

## Current Working Docs

These documents reflect the current rewrite effort and should be treated as the default reference set.

| Document | Description |
| -------- | ----------- |
| [Phased Plan](phased_plan.md) | Top-level implementation roadmap across all phases |
| [Open Questions](open_questions.md) | Decision log for unresolved architecture, data, and evaluation questions |
| [Phase 2 Implementation Plan](phase_plan/phase2_implementation_plan.md) | Detailed build plan with steps, file changes, and verification points |
| [Phase 2 Walkthrough](phase_plan/phase2_walkthrough.md) | End-to-end explanation of how Phase 2 is structured in code |
| [Phase 2 Code Review](phase_plan/phase2_code_review.md) | Review notes comparing implementation against the Phase 2 plan |

## Evaluation Docs

Use these when working on prompt quality, model selection, and evaluation workflow.

| Document | Description |
| -------- | ----------- |
| [LLM Evaluation Plan](eval_plan/llm_eval_plan_V1.0.md) | PDCA-style evaluation strategy for prompts, models, quality, and cost |
| [Scenario 1 Report](eval_plan/eval_report_scenario1.md) | Same-provider model tier comparison results |
| [Scenario 2 Report](eval_plan/eval_report_scenario2.md) | Cross-provider "cheap model" comparison results |
| [Scenario 3 Report](eval_plan/eval_report_scenario3.md) | Cross-provider "expensive model" comparison results |

## Human Reference

Reference material with rationale and development history. Helpful for context, but not the main source of truth for the current rewrite.

| Document | Description |
| -------- | ----------- |
| [Design Decisions](human_reference/design_decisions.md) | Architecture decisions, trade-offs, and why certain patterns were chosen |
| [Dev Log](human_reference/dev_log.md) | Session notes, experiments, and learnings captured over time |

## Legacy / Historical

Older or superseded documents kept for reference only.

| Document | Description |
| -------- | ----------- |
| [Phase 1 Guide](phase1_guide.md) | Legacy long-form implementation guide from the earlier rewrite iteration |
| [Phase 1 Guide (phase_plan copy)](phase_plan/phase1_guide.md) | Duplicate copy of the legacy Phase 1 guide retained in the phase plan folder |
| [Archive](archive/) | Pre-rewrite documentation and historical reference material |
