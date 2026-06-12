import { defineConfig, devices } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Offline/PWA configuration — runs ONLY `tests/offline.spec.ts`.
 *
 * The Angular service worker never runs under `ng serve` (the
 * `isDevMode()` guard keeps dev-mode specs SW-free), so this config
 * serves the BUILT bundle instead of the dev server:
 *
 *   - the .NET API on :5100 exactly like the main config;
 *   - `http-server` (e2e devDependency) on :4200 serving
 *     `frontend/dist/shalom/browser` — the `e2e` build configuration:
 *     production-grade output (optimized ⇒ SW registered) but WITHOUT the
 *     prod `fileReplacements`, so `apiBaseUrl` stays `http://localhost:5100`
 *     (which the ngsw "today"/"auth" dataGroups also match). The
 *     `--proxy http://localhost:4200?` trick gives SPA fallback for deep
 *     links while online (offline navigations are served by ngsw itself).
 *
 * Run via `npm run test:offline`, which builds the bundle first:
 *
 *   npm --prefix ../frontend run build -- shalom --configuration e2e
 *
 * Port 4200 is reused on purpose (the API's dev CORS allows any localhost
 * origin, but 4200 keeps parity with the main suite). STOP any running
 * `ng serve` first — `reuseExistingServer: false` makes the collision an
 * explicit error instead of silently testing the dev bundle.
 */

function readDotEnv(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};
  const result: Record<string, string> = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    result[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return result;
}

const dotEnv = readDotEnv(path.join(__dirname, '.env'));
const shalomConnection = process.env.SHALOM_CONNECTION ?? dotEnv.SHALOM_CONNECTION;

const DIST = path.join(__dirname, '..', 'frontend', 'dist', 'shalom', 'browser');

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/offline.spec.ts'],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  forbidOnly: !!process.env.CI,
  timeout: 120_000, // SW registration is 'registerWhenStable:30000'
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: [
    {
      command:
        'dotnet run --project ../backend/src/Shalom.Api --urls http://localhost:5100',
      url: 'http://localhost:5100/swagger/index.html',
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: __dirname,
      env: {
        ...(process.env as Record<string, string>),
        ASPNETCORE_ENVIRONMENT: 'Development',
        ...(shalomConnection ? { SHALOM_CONNECTION: shalomConnection } : {}),
      },
    },
    {
      command: `node node_modules/http-server/bin/http-server "${DIST}" -p 4200 -c-1 --silent --proxy http://localhost:4200?`,
      url: 'http://localhost:4200',
      reuseExistingServer: false,
      timeout: 30_000,
      cwd: __dirname,
    },
  ],
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
  ],
});
