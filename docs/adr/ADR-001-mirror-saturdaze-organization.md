# ADR-001 — Mirror saturdaze's code organization

**Status:** Accepted
**Date:** 2026-06-12

## Context

Shalom is a greenfield .NET + Angular PWA. Two bootstrap paths existed: the `mvp` CLI scaffolder (which emits the older Forge shape — .NET 9, e2e inside `frontend/`, a `domain` Angular lib, EF migrate-on-startup) or hand-creating the solution to match `C:\projects\saturdaze`, the owner's most recent and most refined reference project (.NET 10, central package management, a packaged CLI tool for database lifecycle, top-level `e2e/`, three-project Angular workspace).

## Decision

Mirror saturdaze exactly: `backend/` (Shalom.sln — Domain/Application/Infrastructure/Api/Cli + four test projects), `frontend/` (Angular 21 workspace: `shalom` app + `api` and `components` libraries), top-level `e2e/` (Playwright, POMs in `pages/`, specs in `tests/`, fixtures in `fixtures/`), `docs/adr/`, `scripts/Start-FreshStack.ps1`. Conventions carried over verbatim: business rules in handlers, no migrate-on-startup (CLI only: `shalom migrate|seed|reset`), interface-driven Angular services injected by `InjectionToken`, component selectors `sh-*` while class names drop the prefix, CDK Dialog for all modals, the ADR-005 bottom-nav chrome-clearance pattern, and the LocalDB named-pipe test connection (saturdaze ADR-001).

## Consequences

- Working scripts, workflows, and fixes transfer with renames instead of being reinvented.
- The `mvp` scaffolder is not used here; its Forge-era output would have required immediate restructuring.
- Saturdaze ADRs remain useful reading; where Shalom inherits a decision, the local ADR references it.
