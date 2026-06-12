# Shalom e2e suite

Playwright end-to-end tests for the Shalom stack (Angular on :4200 + .NET API
on :5100), Page Object Model layout (saturdaze precedent):

- `pages/` — page objects (`sign-in.page.ts`, `today.page.ts`,
  `health.page.ts`, `fast-detail.page.ts`, `base.page.ts`)
- `helpers/` — per-page selector maps (+ `dates.ts` local-date helpers)
- `fixtures/` — the `test` fixture (`sh-test.ts`: POMs + authenticated API
  helper) and seeded credentials (`users.ts`)
- `tests/` — hand-written specs (`auth` (incl. the M8 deep-link
  returnUrl bounce), `today` (morning ritual flow), `night`, `check-in`,
  `reading`, `fasting`, `workouts`, `meals`, `people`, `nudge`,
  `onboarding` (M7 welcome flow), `settings` (M8 fasting-schedule
  round-trip), `discovery` (M8 dismissal persistence), `offline` (M7
  service worker — separate config, see below), `accessibility` (axe
  sweep))
- `scripts/prepare.mjs` — database prep (see below)

## Running

```powershell
cd e2e
npm ci                       # once
npx playwright install chromium   # once
npm test                     # all three viewport projects
npm test -- --project=mobile # the primary project
npm run test:offline         # M7 offline/PWA spec (prod bundle — see below)
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

## Onboarding default (`onboarded` option)

M7's welcome flow intercepts FRESH devices: the auth guard sends
unauthenticated visitors without `sh.onboarded` to `/welcome`, and the
first sign-in detours there for the quick setup. Every existing spec models
a returning device, so the auto fixture pre-sets `sh.onboarded=1` via
`addInitScript`. `onboarding.spec.ts` opts out per-describe with
`test.use({ onboarded: false })`.

## Offline / PWA spec (`npm run test:offline`)

`tests/offline.spec.ts` is excluded from the main config (`testIgnore`) and
runs under `playwright.offline.config.ts`, because the Angular service
worker never runs under `ng serve` (`provideServiceWorker` is guarded by
`!isDevMode()` — which is also what keeps the SW from interfering with the
dev-mode specs above). The offline config:

1. builds the frontend with the `e2e` configuration (the `pretest:offline`
   script): production-grade optimized output **with** the service worker
   but **without** the prod `fileReplacements`, so `apiBaseUrl` stays
   `http://localhost:5100` (the ngsw `today`/`auth` dataGroups list that
   origin alongside the deployed azurewebsites one);
2. starts the same .NET API webServer as the main config (its Development
   CORS policy allows any localhost origin);
3. serves `frontend/dist/shalom/browser` on :4200 with `http-server`
   (resolved from `e2e/node_modules`) using `--proxy http://localhost:4200?`
   as the SPA fallback for online deep links (offline navigations are
   answered by ngsw itself).

**Stop any running `ng serve` first** — the static server binds :4200 and
`reuseExistingServer: false` turns a collision into an explicit error
rather than silently testing the dev bundle. Playwright contexts are
ephemeral, so the registered service worker never leaks into your own
browser or into the dev-mode suite.

The spec signs in online, waits for `navigator.serviceWorker.ready`,
reloads once (a *controlled* load, letting ngsw cache the app shell plus
`/api/today` and `/api/auth/me`), flips `context.setOffline(true)`, reloads
again, and asserts: Today renders from cache, the offline banner shows,
mutation buttons are disabled, and a re-pinned clock changes the
window countdown — proving the live time math runs client-side on the
cached aggregate (the same `appNow()` derivation that drives the fast
elapsed timer). The fixture's pinned clock makes the run deterministic:
14:30 is midday in every seeded schedule (weekday and Sunday override).

## Database prep (`scripts/prepare.mjs`)

Two modes (M8):

- **Env override (CI):** when `SHALOM_CONNECTION` is already set in the
  environment, prepare.mjs uses it **verbatim** — no `sqllocaldb` call is
  made at all (it logs `SHALOM_CONNECTION already set; skipping LocalDB
  pipe resolution.`). The CI job sets a SQL-container connection with
  `Initial Catalog=ShalomE2E`, a catalog dedicated to e2e (the backend
  job's unit-test databases are never shared).
- **Local (default):** LocalDB on this machine must be reached through its
  **named pipe**, not the `(localdb)\MSSQLLocalDB` shortcut (SQL Server
  2025 / SqlClient interop bug — see the root `CLAUDE.md` and saturdaze
  ADR-001). Playwright starts `webServer` **before** `globalSetup`, so the
  pipe cannot be resolved inside the Playwright lifecycle; prepare.mjs
  resolves it via `sqllocaldb info MSSQLLocalDB` (starting the instance
  when needed) and targets `Database=Shalom`.

Either way the `pretest` npm script then:

1. runs `shalom migrate` then `shalom seed` through
   `backend/src/Shalom.Cli` against the connection (both idempotent —
   seeding never touches reading completions or check-ins),
2. writes `SHALOM_CONNECTION=<connection>` to `e2e/.env`.

`playwright.config.ts` reads `.env` synchronously (a ten-line parser — no
dotenv dependency) and passes `SHALOM_CONNECTION` +
`ASPNETCORE_ENVIRONMENT=Development` to the API `webServer` entry. Both
servers use `reuseExistingServer: true`, so an already-running stack (e.g.
from `scripts/Start-FreshStack.ps1`) is picked up as-is.

Specs are repeat-safe: the check-in upsert is idempotent per local day,
`reading.spec.ts` uncompletes today's surfaced reading through the API
before driving the UI, `fasting.spec.ts` ends any open fast first (fasts
are started via the API — the design has no start button),
`workouts.spec.ts` deletes the workout it created in teardown,
`settings.spec.ts` restores the original fasting schedule in a `finally`
(other specs assert the seeded windows), and the auth deep-link spec
archives the person it created. Meals have no delete endpoint;
`meals.spec.ts` asserts on a per-run unique text.

## CI (`.github/workflows/ci.yml`, `e2e` job)

CI runs the suite on ubuntu against a SQL Server 2022 service container:

- `SHALOM_CONNECTION` is set at the job level (`Initial Catalog=ShalomE2E`
  on the container), so prepare.mjs takes the env-override path — no
  `sqllocaldb` anywhere near Linux.
- `TZ=America/Toronto` is pinned at the job level. The pinned-clock
  fixture covers most time math, and the API derives its Toronto local
  days itself via IANA ids (ADR-004) so the runner being UTC would be
  fine server-side — pinning the Node/Playwright side keeps
  `localIsoDate()` and friends honest anyway.
- Only the **mobile** project runs in CI (suite time); the
  tablet/desktop sweeps stay a local pre-merge concern.
- `npm run test:offline` runs in the same job **after** the main suite.
  Ordering matters: the offline config binds :4200 itself with
  `reuseExistingServer: false`, and the main run's `ng serve` is a
  Playwright-owned `webServer` that is torn down when that run exits —
  so the port is free again between the two steps (verified locally by
  running both back-to-back).
- On failure the job uploads `playwright-report/` (the HTML reporter is
  CI-only — see `reporter` in both configs) and `test-results/`
  (traces/screenshots) as one artifact.

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

### M8 reconciliation pass

`ppg workspace ./frontend` (ppg 1.9.0) was re-run into a temp dir and
diffed against the hand-maintained tree:

- **Adopted:** the `data-testid` selector sets for the two surfaces added
  since the original M3 generation that had no POM yet — the Settings
  page (`sh-settings-*`) and the fasting-schedule sheet
  (`sh-sheet-schedule-*`). They were curated into
  `helpers/settings-page.selectors.ts` + `pages/settings.page.ts` in the
  hand-maintained style (sheet locators live on the page POM, the
  person-detail precedent).
- **Rejected:** everything else. Every other `data-testid` the generator
  found was already present in the hand-maintained selector maps
  (verified by diffing the extracted testid sets per page), and the
  generated catch-alls remain unusable (`button`, four identical
  `input[type='time']` entries, `has-text` selectors with broken quote
  escaping — one is literally a TypeScript syntax error). Generated
  tests/config/fixtures lose to the hand-maintained ones as always.

The temp output was deleted after the pass.

`http-server` stays a devDependency on purpose: `scripts/Start-FreshStack.ps1`
resolves it from `e2e/node_modules` to serve the built frontend.
