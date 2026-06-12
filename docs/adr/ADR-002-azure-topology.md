# ADR-002 — Azure topology: App Service + Azure SQL + Static Web Apps

**Status:** Accepted
**Date:** 2026-06-12

## Context

Shalom must be reachable from the owner's iPhone over HTTPS (a hard requirement for PWA install and, later, web push). Alternatives considered: a single Linux App Service serving API + static Angular with SQLite (cheapest), and saturdaze's proven topology (API on App Service, Angular on Azure Static Web Apps, Azure SQL, GitHub Actions deploy that runs the CLI `migrate` step).

## Decision

Use the saturdaze topology: resource group `shalom-rg` in `canadacentral` — App Service for `Shalom.Api`, Azure SQL for the database, Static Web Apps for the Angular PWA. CI/CD via GitHub Actions copied from saturdaze's workflows: publish API → `shalom migrate` → `ng build` → SWA deploy. SQL Server LocalDB locally.

## Consequences

- Deployment scripts, secrets handling (`.deploy/azure.env` locally, GitHub Actions secrets), and the migrate-in-pipeline step transfer directly from saturdaze.
- Slightly higher cost than the SQLite option (~$5–18/mo); accepted for consistency with a known-good setup.
- One provider drift risk eliminated: dev and prod are both SQL Server.
