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

  test('a deep link visited signed-out bounces through sign-in and returns to the target', async ({
    api,
    page,
    pages,
  }) => {
    // requireAuth carries the original URL as ?returnUrl=…; the sign-in
    // page only honors same-origin paths (safeReturnUrl).
    const person = await api.createPerson({
      name: `E2E Deep Link ${Date.now()}`,
      relationship: 'Friend',
    });
    try {
      await pages.personDetail.navigateTo(person.id);

      await expect(page).toHaveURL(/\/sign-in\?returnUrl=%2Fpeople%2F/);
      await pages.signIn.signIn(SEEDED_USER.email, SEEDED_USER.password);

      // Back where we were headed, with the detail page actually loaded.
      await expect(page).toHaveURL(new RegExp(`/people/${person.id}$`));
      await expect(pages.personDetail.name).toHaveText(person.name);
    } finally {
      await api.archivePerson(person.id);
    }
  });
});
