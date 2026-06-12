import { SEEDED_USER } from '../fixtures/users';
import { expect, test } from '../fixtures/sh-test';

test.describe('authentication', () => {
  test('signing in with the seeded user lands on /today', async ({
    page,
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();

    await expect(page).toHaveURL(/\/today$/);
    await expect(pages.today.greeting).toContainText(SEEDED_USER.greetingName);
    await expect(pages.today.date).not.toBeEmpty();
    // Morning band (the fixture pins 08:00): status pill + either the
    // ritual hero or the compact morning-complete card.
    await expect(pages.today.statusPill).toBeVisible();
    await expect(pages.today.ritualHero.or(pages.today.morningComplete).first()).toBeVisible();
  });

  test('visiting /today unauthenticated redirects to sign-in', async ({ page, pages }) => {
    await pages.today.navigate();

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(pages.signIn.submitButton).toBeVisible();
  });
});
