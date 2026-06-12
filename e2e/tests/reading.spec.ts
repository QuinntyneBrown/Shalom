import { expect, test } from '../fixtures/sh-test';

test.describe('reading plan', () => {
  test.beforeEach(async ({ api }) => {
    // Make the run repeatable: if today's surfaced reading was already
    // completed (by an earlier run on the same local day), uncomplete it
    // through the API before driving the UI.
    const today = await api.getToday();
    if (today.reading?.completedToday) {
      await api.uncompleteDay(today.reading.dayId);
    }
  });

  test('marking the reading read shows the completed state and bumps the count', async ({
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();

    await expect(pages.today.readingCard).toBeVisible();
    await expect(pages.today.readingPlanName).toHaveText('John & His Letters');
    const before = await pages.today.completedCount();

    await expect(pages.today.markReadButton).toBeVisible();
    await pages.today.markReadButton.click();

    await expect(pages.today.readingDone).toBeVisible();
    await expect(pages.today.readingDone).toContainText('Read today');
    await expect(pages.today.markReadButton).toHaveCount(0);

    await expect(pages.today.readingProgress).toContainText(`${before + 1} of`);
    await expect(pages.today.streaks).toContainText(/[1-9]\d*-day reading rhythm/);
  });

  test('the YouVersion link points at bible.com and opens in a new tab', async ({
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();

    // Assert the href/target without navigating — we never actually
    // leave for YouVersion inside the suite.
    await expect(pages.today.readingLink).toHaveAttribute(
      'href',
      /^https:\/\/www\.bible\.com\/bible\/111\//,
    );
    await expect(pages.today.readingLink).toHaveAttribute('target', '_blank');

    await expect(pages.today.verseLink).toHaveAttribute(
      'href',
      /^https:\/\/www\.bible\.com\/bible\/111\//,
    );
    await expect(pages.today.verseLink).toHaveAttribute('target', '_blank');
  });
});
