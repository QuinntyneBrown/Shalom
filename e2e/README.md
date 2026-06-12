# Shalom e2e suite

Playwright end-to-end tests for the Shalom stack (Angular on :4200 + .NET API
on :5100), Page Object Model layout (saturdaze precedent):

- `pages/` — page objects (`sign-in.page.ts`, `today.page.ts`,
  `health.page.ts`, `fast-detail.page.ts`, `base.page.ts`)
- `helpers/` — per-page selector maps (+ `dates.ts` local-date helpers)
- `fixtures/` — the `test` fixture (`sh-test.ts`: POMs + authenticated API
  helper) and seeded credentials (`users.ts`)
- `tests/` — hand-written specs (`auth`, `today` (morning ritual flow),
  `night`, `check-in`, `reading`, `fasting`, `workouts`, `meals`, `people`,
  `nudge`, `accessibility` (axe sweep))
- `scripts/prepare.mjs` — database prep (see below)

## Running

```powershell
cd e2e
npm ci                       # once
npx playwright install chromium   # once
npm test                     # all three viewport projects
npm test -- --project=mobile # the primary project
```

`npm test` triggers the `pretest` script (database prep) automatically. If
you run `npx playwright test` directly, run `node scripts/prepare.mjs` once
first.

Projects: `mobile` (390x844, primary), `tablet` (820x1180), `desktop`
(1440x900). One worker, no parallelism — specs share one seeded database.

## Deterministic clock (`pinClock`)

Today is time-aware (morning / midday / evening / night bands, dawn theme),
so specs must not depend on when the suite runs. The app reads device time
through one helper (`appNow()`), which honors `window.__shTestNow` ONLY when
`localStorage['sh.testMode'] === '1'`. The fixture pins **08:00 local of the
real current date** for every test via `addInitScript` (the date must stay
the real one so server-derived local days match). To pin a different moment,
call `pinClock(page, iso)` from `fixtures/sh-test.ts` BEFORE navigating —
init scripts run in order, so the later pin wins:

```ts
import { localIsoDate, pinClock, test } from '../fixtures/sh-test';

await pinClock(page, `${localIsoDate()}T23:00:00`); // night band
```

Production traffic never trips the hook: `sh.testMode` is only ever written
by the fixtures.

## Database prep (`scripts/prepare.mjs`)

LocalDB on this machine must be reached through its **named pipe**, not the
`(localdb)\MSSQLLocalDB` shortcut (SQL Server 2025 / SqlClient interop bug —
see the root `CLAUDE.md` and saturdaze ADR-001). Playwright starts
`webServer` **before** `globalSetup`, so the pipe cannot be resolved inside
the Playwright lifecycle. Instead the `pretest` npm script:

1. resolves the pipe via `sqllocaldb info MSSQLLocalDB` (starting the
   instance when needed),
2. runs `shalom migrate` then `shalom seed` through
   `backend/src/Shalom.Cli` against the resolved connection (both
   idempotent — seeding never touches reading completions or check-ins),
3. writes `SHALOM_CONNECTION=<pipe connection>` to `e2e/.env`.

`playwright.config.ts` reads `.env` synchronously (a ten-line parser — no
dotenv dependency) and passes `SHALOM_CONNECTION` +
`ASPNETCORE_ENVIRONMENT=Development` to the API `webServer` entry. Both
servers use `reuseExistingServer: true`, so an already-running stack (e.g.
from `scripts/Start-FreshStack.ps1`) is picked up as-is.

Specs are repeat-safe: the check-in upsert is idempotent per local day,
`reading.spec.ts` uncompletes today's surfaced reading through the API
before driving the UI, `fasting.spec.ts` ends any open fast first (fasts
are started via the API — the design has no start button), and
`workouts.spec.ts` deletes the workout it created in teardown. Meals have
no delete endpoint; `meals.spec.ts` asserts on a per-run unique text.

## Regenerating POM infrastructure

The selector maps and the page-object/fixture layout were bootstrapped with
the `ppg` dotnet global tool (PlaywrightPomGenerator):

```powershell
# from the repo root
ppg workspace ./frontend -o ./e2e
```

ppg writes its raw tree under `e2e/<app>/e2e/`; the valuable parts
(selectors, page objects, fixture pattern) were curated into `helpers/`,
`pages/`, and `fixtures/`, with weak catch-all locators (`button`, `p`)
hand-refined to the stable `sh-*`/class hooks. This `playwright.config.ts`
and `package.json` are hand-maintained and always win over generated ones.
Never rebuild the `ppg` tool from source on this machine (Smart App Control).

`http-server` stays a devDependency on purpose: `scripts/Start-FreshStack.ps1`
resolves it from `e2e/node_modules` to serve the built frontend.
