import { addDaysIso } from '../helpers/dates';
import { expect, localIsoDate, test } from '../fixtures/sh-test';

/**
 * Discovery — progressive disclosure's one quiet voice (M8 gap-fill).
 * Dismissal is a SEVEN-DAY SNOOZE persisted in localStorage
 * (`sh.discovery.snooze.<id>`), never a lock; and the slot stays quiet for
 * the rest of the day (one card per day, stable within the day).
 *
 * Determinism: the engine is seeded directly through its `sh.discovery.*`
 * keys — six days of use (so "Meal notes" is eligible but week-2/3 teasers
 * are not) with the two earlier cards retired, nothing shown yesterday,
 * nothing snoozed. The init script seeds ONCE per browser context (marker
 * key), so the reload halfway through the test does not wipe the snooze
 * being asserted.
 */
test.describe('discovery — dismissal persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((firstOpenIso) => {
      try {
        if (window.localStorage.getItem('sh.discovery.e2eSeeded')) return;
        for (const key of Object.keys(window.localStorage)) {
          if (key.startsWith('sh.discovery.')) window.localStorage.removeItem(key);
        }
        window.localStorage.setItem('sh.discovery.firstOpen', firstOpenIso);
        window.localStorage.setItem('sh.discovery.done', 'streaks,fast-schedule');
        window.localStorage.setItem('sh.discovery.e2eSeeded', '1');
      } catch {
        // about:blank and friends — the app origin will run this again.
      }
    }, addDaysIso(localIsoDate(), -5));
  });

  test('dismissing the card writes a 7-day snooze that survives reload', async ({
    page,
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();

    // Day six, earlier cards retired → the one card is "Meal notes".
    await expect(pages.today.discovery).toBeVisible();
    await expect(pages.today.discovery).toContainText('Meal notes');

    await pages.today.discoveryDismiss.click();
    await expect(pages.today.discovery).toHaveCount(0);

    // Dismiss = snooze until exactly seven days out, persisted.
    const snoozedUntil = await page.evaluate(() =>
      window.localStorage.getItem('sh.discovery.snooze.meal-notes'),
    );
    expect(snoozedUntil).toBe(addDaysIso(localIsoDate(), 7));

    // Across a reload the snooze holds — and no OTHER card jumps into the
    // slot the same day (stable-within-the-day rule).
    await page.reload();
    await expect(pages.today.greeting).toBeVisible({ timeout: 15_000 });
    await expect(pages.today.discovery).toHaveCount(0);
  });
});
