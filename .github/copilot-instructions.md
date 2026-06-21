# Copilot Instructions

Shared policy source: `AGENTS.md` at repository root. Keep this file aligned with that source.

## SDD / OpenSpec workflow

Before medium or large code changes, read:

1. `docs/ai/README.md`
2. `docs/ai/workflow.md`
3. `openspec/project.md`
4. The active change under `openspec/changes/<change-id>/`

Do not change routes, API calls, permissions, login flow, payment flow, build behavior, or broad UI behavior without an OpenSpec change, unless the PR explicitly declares `OpenSpec-Exempt: true` with a clear reason.

## Frontend verification

For UI changes, run the relevant build command and verify affected pages in a browser when possible. Style-only changes must not alter API calls, login state, permissions, or core interactions.
