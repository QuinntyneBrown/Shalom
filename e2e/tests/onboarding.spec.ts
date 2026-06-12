import { SEEDED_USER } from '../fixtures/users';
import { expect, test } from '../fixtures/sh-test';

/**
 * M7 onboarding (designs 16–18).
 *
 * Flow under test:
 *   - fresh device (no `sh.onboarded`), signed out → any guarded URL lands
 *     on /welcome; the three steps end at sign-in;
 *   - first sign-in with `sh.onboarded` still unset → /welcome again as a
 *     quick setup starting at step 2 (rhythm pre-filled from the server);
 *   - finished devices never see it again; Settings → "Replay welcome".
 */

test.describe('first run (fresh device)', () => {
  test.use({ onboarded: false });

  test('a fresh visitor walks the three welcome steps and lands at sign-in', async ({
    page,
    pages,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/welcome$/);

    // Step 1 — the promise.
    await expect(pages.welcome.step1).toBeVisible();
    await expect(pages.welcome.step1).toContainText('Shalom.');
    await expect(pages.welcome.step1).toContainText('Wholeness, one morning at a time.');
    await expect(pages.welcome.step1).toContainText('A 2-minute morning ritual');
    await expect(pages.welcome.step1).toContainText('Fasting that fits your real life');
    await expect(pages.welcome.step1).toContainText('Stay close to the people you love');
    await pages.welcome.continueButton.click();

    // Step 2 — the rhythm: wake time persists device-locally.
    await expect(pages.welcome.step2).toBeVisible();
    await expect(pages.welcome.wakeValue).toContainText('6:00 AM');
    await expect(pages.welcome.windowValue).toContainText('12:00 PM – 8:00 PM');
    await pages.welcome.setWakeTime('05:30');
    await expect(pages.welcome.wakeValue).toContainText('5:30 AM');
    await pages.welcome.continueButton.click();

    // Step 3 — make it yours (browser tab ⇒ the A2HS how-to, not "all set").
    await expect(pages.welcome.step3).toBeVisible();
    await expect(pages.welcome.a2hsCard).toContainText('Add to Home Screen');
    await expect(pages.welcome.installed).toHaveCount(0);
    await pages.welcome.shortcutsHow.click();
    await expect(pages.welcome.shortcutsNote).toContainText('When my alarm is stopped');

    await pages.welcome.finishButton.click();
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(pages.signIn.submitButton).toBeVisible();

    const persisted = await page.evaluate(() => ({
      onboarded: localStorage.getItem('sh.onboarded'),
      wakeTime: localStorage.getItem('sh.wakeTime'),
    }));
    expect(persisted).toEqual({ onboarded: '1', wakeTime: '05:30' });
  });

  test('the first sign-in detours to the quick setup (steps 2–3) and finishes to /today', async ({
    page,
    pages,
    api,
  }) => {
    const { schedule } = await api.getCurrentFast();

    await pages.signIn.navigate();
    await pages.signIn.signIn(SEEDED_USER.email, SEEDED_USER.password);

    await expect(page).toHaveURL(/\/welcome$/);
    // Quick setup: step 1 is skipped, the rhythm pre-fills from the server.
    await expect(pages.welcome.step2).toBeVisible();
    await expect(pages.welcome.step1).toHaveCount(0);
    await expect(pages.welcome.windowValue).toContainText(
      twelveHour(schedule.eatingWindowStart),
    );

    await pages.welcome.continueButton.click();
    await expect(pages.welcome.step3).toBeVisible();
    await pages.welcome.finishButton.click();

    await expect(page).toHaveURL(/\/today$/);
    await expect(pages.today.greeting).toBeVisible({ timeout: 15_000 });
    expect(await page.evaluate(() => localStorage.getItem('sh.onboarded'))).toBe('1');
  });
});

test.describe('returning device', () => {
  test('never auto-shows: an unauthenticated visit goes straight to sign-in', async ({
    page,
    pages,
  }) => {
    await pages.today.navigate();
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(pages.signIn.submitButton).toBeVisible();
  });

  test('Settings → "Replay welcome" replays all three steps; "start right now" opens the ritual', async ({
    page,
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();

    await page.goto('/settings');
    await page.locator('[data-testid="sh-settings-replay-welcome"]').click();
    await expect(page).toHaveURL(/\/welcome$/);

    // Replay starts from step 1 even though the device is onboarded.
    await expect(pages.welcome.step1).toBeVisible();
    await pages.welcome.continueButton.click();
    await expect(pages.welcome.step2).toBeVisible();
    await pages.welcome.continueButton.click();
    await expect(pages.welcome.step3).toBeVisible();

    await pages.welcome.startNowButton.click();
    await expect(page).toHaveURL(/\/today\/ritual$/);
  });
});

/** "1:30 PM" from an API TimeOnly string ("13:30:00") — mirrors the page's display voice. */
function twelveHour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}
