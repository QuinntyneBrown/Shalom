import { expect, test } from '../fixtures/sh-test';

/**
 * The daily check-in now lives in ritual step 1 (M6). The upsert is
 * idempotent per local day, so re-runs simply update the existing row.
 */
test.describe('daily check-in (ritual step 1)', () => {
  test('saving via Continue persists, and the ritual prefills it afterwards', async ({
    api,
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();

    await pages.ritual.navigate();
    await expect(pages.ritual.stepCheckIn).toBeVisible();

    await pages.ritual.moodChip('Steady').click();
    await pages.ritual.closenessDot(3).click();
    await pages.ritual.noteInput.fill('e2e: settled into the morning');
    await expect(pages.ritual.continueButton).toBeEnabled();
    await pages.ritual.continueButton.click();

    // The flow advances immediately (optimistic save)…
    await expect(pages.ritual.stepScripture).toBeVisible();

    // …and the server really has it.
    await expect(async () => {
      const today = await api.getToday();
      expect(today.checkIn).not.toBeNull();
    }).toPass();

    // A fresh ritual visit prefills the saved ratings and note.
    await pages.ritual.navigate();
    await expect(pages.ritual.moodChip('Steady')).toHaveClass(/selected/);
    await expect(pages.ritual.closenessDot(3)).toHaveClass(/selected/);
    await expect(pages.ritual.noteInput).toHaveValue('e2e: settled into the morning');
    await expect(pages.ritual.continueButton).toBeEnabled();
  });

  test('Continue stays disabled until both ratings are chosen', async ({
    api,
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();
    await pages.ritual.navigate();
    await expect(pages.ritual.stepCheckIn).toBeVisible();

    // Only meaningful when nothing is saved yet; with a saved check-in the
    // chips arrive pre-selected, so just assert the enabled state then.
    const today = await api.getToday();
    if (today.checkIn) {
      await expect(pages.ritual.continueButton).toBeEnabled();
      return;
    }

    await expect(pages.ritual.continueButton).toBeDisabled();
    await pages.ritual.moodChip('Full').click();
    await expect(pages.ritual.continueButton).toBeDisabled();
    await pages.ritual.closenessDot(4).click();
    await expect(pages.ritual.continueButton).toBeEnabled();
  });
});
