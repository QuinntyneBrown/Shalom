import { SEEDED_USER } from '../fixtures/users';
import { expect, localIsoDate, pinClock, test } from '../fixtures/sh-test';

/**
 * Night state (22:00–4:30): the app models rest, not hustle. A verse
 * fragment, "Shalom. Rest well.", and NOT ONE call to action — only the
 * bottom nav remains. The clock is re-pinned to 23:00 (overriding the
 * fixture's 08:00 default) before the app loads.
 */
test.describe('today — night state', () => {
  test('at 23:00 Today rests: verse fragment, no header, no CTAs', async ({
    page,
    pages,
  }) => {
    await pinClock(page, `${localIsoDate()}T23:00:00`);

    await pages.signIn.navigate();
    await pages.signIn.signIn(SEEDED_USER.email, SEEDED_USER.password);

    await expect(pages.today.night).toBeVisible({ timeout: 15_000 });
    await expect(pages.today.night).toContainText('He gives sleep to his loved ones.');
    await expect(pages.today.night).toContainText('Psalm 127:2 · WEB');
    await expect(pages.today.night).toContainText('Shalom. Rest well.');

    // No greeting header, no cards, and zero interactive elements inside
    // the page frame — the bottom nav (outside .sh-frame) is the only way on.
    await expect(pages.today.greeting).toHaveCount(0);
    await expect(pages.today.ritualHero).toHaveCount(0);
    await expect(page.locator('.sh-frame button, .sh-frame a')).toHaveCount(0);
    await expect(page.locator('sh-bottom-nav')).toBeVisible();
  });
});
