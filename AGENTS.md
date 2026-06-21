# Agent Instructions

This file defines shared rules for AI agents in this repository.

## Mandatory SDD / OpenSpec workflow

This repository uses SDD + OpenSpec + harness discipline for all AI-assisted development.

Before code changes, every agent must read:

1. `docs/ai/README.md`
2. `docs/ai/02-workflow.md`
3. `openspec/project.md`
4. The active change under `openspec/changes/<change-id>/`, unless the task is explicitly OpenSpec-exempt.

Rules:

- Do not start medium or large code changes without an OpenSpec change.
- Do not change routes, API calls, permissions, login flow, payment flow, build behavior, or broad UI behavior without `proposal.md`, `design.md`, `tasks.md`, and `specs/**/spec.md`.
- Preserve user changes. Never discard local edits unless the user explicitly asks.
- Keep edits scoped to the current task.
- Run relevant verification and report exact results.
- If skipping OpenSpec for a tiny change, the PR must include `OpenSpec-Exempt: true` and a clear reason.

Recommended Codex prompt:

```text
请先阅读 AGENTS.md、docs/ai/README.md、openspec/project.md，以及 openspec/changes/<change-id>/ 下的 proposal/design/tasks/spec。
按 tasks.md 小步实现，不做无关重构。
完成后运行验证并汇报。
```
