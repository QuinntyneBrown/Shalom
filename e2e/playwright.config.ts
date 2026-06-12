import { defineConfig, devices } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Two-server configuration (saturdaze precedent: sequential, one worker):
 *
 *   - the .NET API on http://localhost:5100 (`dotnet run`), pointed at the
 *     LocalDB database through SHALOM_CONNECTION,
 *   - the Angular dev server on http://localhost:4200 (`npm start` in
 *     ../frontend) — the implementation under test (baseURL).
 *
 * Database prep happens in scripts/prepare.mjs (the `pretest` npm script):
 * Playwright starts `webServer` BEFORE `globalSetup`, so the LocalDB named
 * pipe cannot be resolved inside the test run. prepare.mjs resolves the
 * pipe, runs `shalom migrate` + `seed`, and writes SHALOM_CONNECTION to
 * e2e/.env; this config reads that file synchronously (tiny hand-rolled
 * parser — no dotenv dependency) and hands the value to the API server.
 *
 * Run `npm test` (which triggers pretest), not bare `npx playwright test`,
 * unless you have already run `node scripts/prepare.mjs` once.
 */

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1440, height: 900 },
} as const;

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

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  forbidOnly: !!process.env.CI,
  timeout: 30_000,
  expect: {
    timeout: 8_000,
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
      command: 'npm start',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 240_000,
      cwd: path.join(__dirname, '..', 'frontend'),
    },
  ],
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS.mobile },
    },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS.tablet },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS.desktop },
    },
  ],
});

export { VIEWPORTS };
