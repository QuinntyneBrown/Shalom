/**
 * Database preparation for the e2e suite — runs as the `pretest` npm script.
 *
 * LocalDB on this machine must be reached via its named pipe, not the
 * `(localdb)\MSSQLLocalDB` shortcut (SQL Server 2025 / SqlClient interop bug;
 * see CLAUDE.md and saturdaze ADR-001). Playwright's `webServer` starts
 * BEFORE `globalSetup` runs, so the pipe cannot be resolved there. Instead:
 *
 *   1. resolve the pipe via `sqllocaldb info MSSQLLocalDB` (starting the
 *      instance if needed),
 *   2. run `shalom migrate` + `shalom seed` through the CLI project against
 *      the resolved connection (idempotent, safe to re-run),
 *   3. write SHALOM_CONNECTION to e2e/.env, which playwright.config.ts reads
 *      synchronously and passes to the API webServer's env.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const e2eDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(e2eDir, '..');
const cliProject = path.join(repoRoot, 'backend', 'src', 'Shalom.Cli');

function resolveLocalDbPipe() {
  const info = () =>
    execFileSync('sqllocaldb', ['info', 'MSSQLLocalDB'], { encoding: 'utf8' });

  let match = info().match(/Instance pipe name:\s*(\S+)/);
  if (!match) {
    console.log('LocalDB not running; starting MSSQLLocalDB...');
    execFileSync('sqllocaldb', ['start', 'MSSQLLocalDB'], { stdio: 'inherit' });
    match = info().match(/Instance pipe name:\s*(\S+)/);
  }
  if (!match) {
    throw new Error('Could not resolve the MSSQLLocalDB named pipe.');
  }
  return match[1];
}

const pipe = resolveLocalDbPipe();
const connection =
  `Server=${pipe};Database=Shalom;Trusted_Connection=True;` +
  'TrustServerCertificate=True;Min Pool Size=1';

console.log(`Resolved LocalDB pipe: ${pipe}`);

for (const command of ['migrate', 'seed']) {
  console.log(`Running shalom ${command}...`);
  execFileSync(
    'dotnet',
    ['run', '--project', cliProject, '--', '--connection', connection, command],
    { stdio: 'inherit', cwd: repoRoot },
  );
}

writeFileSync(path.join(e2eDir, '.env'), `SHALOM_CONNECTION=${connection}\n`);
console.log('Wrote e2e/.env with SHALOM_CONNECTION.');
