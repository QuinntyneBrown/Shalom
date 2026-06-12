import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';

import { expect, test } from '../fixtures/sh-test';

/**
 * Axe sweep over the main surfaces: sign-in, Today (morning), every ritual
 * step, Health, People, and Settings. The bar: no violations with serious
 * or critical impact. (Lower-impact findings are reported as annotations in
 * the failure message only when the bar is broken.)
 */
async function expectNoSeriousViolations(page: Page, surface: string): Promise<void> {
  // Let entry animations finish — axe computes contrast from the live
  // styles, and a step mid-fade reads as washed-out text.
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))),
  );
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  const summary = blocking.map(
    (violation) =>
      `${surface}: [${violation.impact}] ${violation.id} — ${violation.help}\n` +
      violation.nodes
        .slice(0, 5)
        .map((node) => `    ${node.target.join(' ')} :: ${node.failureSummary ?? ''}`)
        .join('\n'),
  );
  expect(summary, `serious/critical axe violations on ${surface}`).toEqual([]);
}

test.describe('accessibility', () => {
  // The ritual's entry animations fade steps in from opacity 0; axe would
  // sample the blended mid-animation colors. The app honors
  // prefers-reduced-motion (no animation at all), so the sweep runs there —
  // which also exercises that path.
  test.use({ reducedMotion: 'reduce' });

  test('sign-in page has no serious violations', async ({ pages, page }) => {
    await pages.signIn.navigate();
    await expect(pages.signIn.submitButton).toBeVisible();
    await expectNoSeriousViolations(page, 'sign-in');
  });

  test('Today (morning) and the four ritual steps have no serious violations', async ({
    page,
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();
    await expectNoSeriousViolations(page, 'today');

    await pages.ritual.navigate();
    await expect(pages.ritual.stepCheckIn).toBeVisible();
    await expectNoSeriousViolations(page, 'ritual/check-in');

    await pages.ritual.completeCheckIn('Steady', 3);
    await expect(pages.ritual.stepScripture).toBeVisible();
    await expectNoSeriousViolations(page, 'ritual/scripture');

    await pages.ritual.markReadButton.click();
    await expect(pages.ritual.stepPrayer).toBeVisible();
    await expectNoSeriousViolations(page, 'ritual/prayer');

    await pages.ritual.amenButton.click();
    await expect(pages.ritual.stepPreview).toBeVisible();
    await expectNoSeriousViolations(page, 'ritual/day-preview');

    await pages.ritual.doneButton.click();
    await expect(pages.ritual.complete).toBeVisible();
    await expectNoSeriousViolations(page, 'ritual/complete');
  });

  test('Health, People, and Settings have no serious violations', async ({
    page,
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();

    await pages.health.navigate();
    await expect(page).toHaveURL(/\/health$/);
    await expectNoSeriousViolations(page, 'health');

    await pages.people.navigate();
    await expect(page).toHaveURL(/\/people$/);
    await expectNoSeriousViolations(page, 'people');

    await page.goto('/settings');
    await expect(page.locator('h1')).toContainText('Settings');
    await expectNoSeriousViolations(page, 'settings');
  });
});
