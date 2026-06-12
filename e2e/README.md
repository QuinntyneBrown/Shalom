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
  `nudge`, `onboarding` (M7 welcome flow), `offline` (M7 service worker —
  separate config, see below), `accessibility` (axe sweep))
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
