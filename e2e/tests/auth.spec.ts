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
    await expect(pages.today.verseCard).toBeVisible();
    await expect(pages.today.verseText).not.toBeEmpty();
    await expect(pages.today.verseReference).not.toBeEmpty();
  });

  test('visiting /today unauthenticated redirects to sign-in', async ({ page, pages }) => {
    await pages.today.navigate();

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(pages.signIn.submitButton).toBeVisible();
  });
});
