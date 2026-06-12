import { expect, test } from '../fixtures/sh-test';

test.describe('daily check-in', () => {
  test('saving a check-in persists and chips reflect it after reload', async ({
    page,
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();

    // Pick "Steady" (mood 4) + closeness dot 3 and save. The upsert is
    // idempotent server-side, so re-runs on the same local day simply
    // update the existing row.
    await pages.today.selectMood('Steady');
    await pages.today.selectDot(3);
    await pages.today.noteInput.fill('e2e: settled into the morning');
    await expect(pages.today.saveButton).toBeEnabled();
    await pages.today.saveCheckIn();

    await expect(pages.today.savedBadge).toBeVisible();

    // Reload — the page must re-hydrate the saved check-in from the API.
    await page.reload();
    await expect(pages.today.greeting).toBeVisible({ timeout: 15_000 });

    await expect(pages.today.moodChip('Steady')).toHaveClass(/selected/);
    await expect(pages.today.dot(3)).toHaveClass(/selected/);
    await expect(pages.today.noteInput).toHaveValue('e2e: settled into the morning');
    await expect(pages.today.savedBadge).toBeVisible();
  });

  test('save stays disabled until both ratings are chosen', async ({
    pages,
    api,
    signInAsSeededUser,
    page,
  }) => {
    // Only meaningful when nothing is saved yet; with a saved check-in the
    // chips arrive pre-selected, so just assert the enabled state then.
    await signInAsSeededUser();

    const today = await api.getToday();
    if (today.checkIn) {
      await expect(pages.today.saveButton).toBeEnabled();
      return;
    }

    await expect(pages.today.saveButton).toBeDisabled();
    await pages.today.selectMood('Full');
    await expect(pages.today.saveButton).toBeDisabled();
    await pages.today.selectDot(4);
    await expect(pages.today.saveButton).toBeEnabled();
  });
});
