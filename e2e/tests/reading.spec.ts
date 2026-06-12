import { expect, test } from '../fixtures/sh-test';

/**
 * The reading plan surfaces inside ritual step 2 (M6). Repeat-safe: today's
 * surfaced reading is uncompleted through the API before driving the UI.
 */
test.describe('reading plan (ritual step 2)', () => {
  test.beforeEach(async ({ api }) => {
    const today = await api.getToday();
    if (today.reading?.completedToday) {
      await api.uncompleteDay(today.reading.dayId);
    }
  });

  test('Mark read · Continue completes the day and bumps the count', async ({
    api,
    pages,
    signInAsSeededUser,
  }) => {
    const before = await api.getToday();
    expect(before.reading).not.toBeNull();

    await signInAsSeededUser();
    await pages.ritual.navigate();
    await pages.ritual.completeCheckIn('Steady', 3);

    await expect(pages.ritual.stepScripture).toBeVisible();
    await expect(pages.ritual.readingPassage).toHaveText(before.reading!.passageReference);
    await expect(pages.ritual.markReadButton).toContainText('Mark read · Continue');
    await pages.ritual.markReadButton.click();

    // Advances to prayer at once; the completion lands server-side.
    await expect(pages.ritual.stepPrayer).toBeVisible();
    await expect(async () => {
      const after = await api.getToday();
      expect(after.reading?.completedToday).toBe(true);
      expect(after.reading?.completedCount).toBe(before.reading!.completedCount + 1);
    }).toPass();
  });

  test('the YouVersion link points at bible.com and opens in a new tab', async ({
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();
    await pages.ritual.navigate();
    await pages.ritual.completeCheckIn('Steady', 3);

    // Assert the href/target without navigating — we never actually leave
    // for YouVersion inside the suite.
    await expect(pages.ritual.youVersionLink).toHaveAttribute(
      'href',
      /^https:\/\/www\.bible\.com\/bible\/111\//,
    );
    await expect(pages.ritual.youVersionLink).toHaveAttribute('target', '_blank');
    await expect(pages.ritual.verseText).not.toBeEmpty();
    await expect(pages.ritual.verseReference).toContainText('WEB');
  });
});
