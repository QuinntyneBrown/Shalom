# Shalom

A personal wellness PWA — wholeness for the whole person. Shalom is the first thing checked at 6am: a calm, 2-minute morning ritual (emotional/spiritual check-in → Scripture → prayer → day preview), a schedule-first intermittent-fasting companion, home-cardio workout tracking, and gentle daily nudges to stay connected with the people who matter.

**Design north star:** one calm screen at 6am, a 2-minute ritual, and an app that gets quieter — not louder — as the day goes on.

## Stack

- **Backend** — .NET 10 Clean Architecture (`backend/Shalom.sln`): MediatR CQRS, FluentValidation, EF Core + SQL Server, local JWT auth, `shalom` CLI dotnet tool for `migrate | seed | reset`
- **Frontend** — Angular 21 workspace (`frontend/`): `shalom` app + `api` and `components` libraries, Material Design 3 "dawn calm" theme, Signals, PWA
- **E2E** — Playwright with Page Object Model (`e2e/`)
- **Design** — `design/shalom.pen` (Pencil) is the authoritative UI spec
- **Hosting** — Azure App Service + Azure SQL + Static Web Apps (`canadacentral`)

## Getting started

```powershell
# One command: pack CLI → reset LocalDB → build everything → run API (:5100) + frontend
powershell .\scripts\Start-FreshStack.ps1
```

See `CLAUDE.md` for the full command reference and conventions, and `docs/adr/` for architecture decisions.
