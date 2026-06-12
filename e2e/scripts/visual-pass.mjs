// M6 visual pass: capture Today-morning, the four ritual steps, the
// completion screen, and Settings at 390x844 for side-by-side comparison
// against design/exports. Diagnostic tooling, not part of the test suite.
// Usage: node scripts/visual-pass.mjs [outDir]   (stack on :4200/:5100)
import { chromium } from '@playwright/test';
import * as fs from 'node:fs';

const outDir = process.argv[2] ?? 'visual-pass';
fs.mkdirSync(outDir, { recursive: true });

const iso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const run = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.addInitScript((pinned) => {
    try {
      window.localStorage.setItem('sh.testMode', '1');
      window.__shTestNow = pinned;
    } catch {}
  }, `${iso()}T06:11:00`);

  await page.goto('http://localhost:4200/sign-in');
  await page.fill("[formControlName='email']", 'quinntynebrown@gmail.com');
  await page.fill("[formControlName='password']", 'password123');
  await page.click('button:has-text("Sign in")');
  await page.waitForSelector('h1.greeting', { timeout: 20_000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}/01-today-morning.png` });

  await page.goto('http://localhost:4200/today/ritual');
  await page.waitForSelector('[data-testid="sh-ritual-step-checkin"]');
  // Match design 05: Steady selected + dot 3.
  await page.locator('sh-rating-chips button.chip', { hasText: 'Steady' }).click();
  await page.locator('sh-dot-scale button.dot').nth(2).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/05-ritual-1-check-in.png` });

  await page.click('[data-testid="sh-ritual-continue"]');
  await page.waitForSelector('[data-testid="sh-ritual-step-scripture"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/06-ritual-2-scripture.png` });

  await page.click('[data-testid="sh-ritual-mark-read"]');
  await page.waitForSelector('[data-testid="sh-ritual-step-prayer"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/07-ritual-3-prayer.png` });

  await page.click('[data-testid="sh-ritual-amen"]');
  await page.waitForSelector('[data-testid="sh-ritual-step-preview"]');
  await page.locator('[data-testid="sh-ritual-intention-IndoorBike"]').click().catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/08-ritual-4-day-preview.png` });

  await page.click('[data-testid="sh-ritual-done"]');
  await page.waitForSelector('[data-testid="sh-ritual-complete"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}/09-ritual-complete.png` });

  await page.goto('http://localhost:4200/settings');
  await page.waitForSelector('[data-testid="sh-settings-fasting"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/19-settings.png` });

  await page.goto('http://localhost:4200/settings/everything');
  await page.waitForSelector('text=Take what serves you');
  await page.screenshot({ path: `${outDir}/20-everything.png`, fullPage: true });

  // Night state for the dawn theme check.
  await page.addInitScript((pinned) => {
    window.__shTestNow = pinned;
  }, `${iso()}T23:00:00`);
  await page.goto('http://localhost:4200/today');
  await page.waitForSelector('[data-testid="sh-today-night"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/04-today-night.png` });

  await browser.close();
  console.log('done →', outDir);
};
run();
