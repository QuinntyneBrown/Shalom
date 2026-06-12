import { expect, localIsoDate, test } from '../fixtures/sh-test';

test.describe('workouts', () => {
  // Repeat-run safe: every workout this spec creates today is removed via
  // the API afterwards, so re-runs never accumulate rows.
  test.afterEach(async ({ api }) => {
    const today = localIsoDate();
    const created = await api.listWorkouts(today, today);
    for (const w of created) {
      if (w.equipment === 'IndoorBike' && w.durationMinutes === 25 && w.notes?.startsWith('effort:steady')) {
        await api.deleteWorkout(w.id);
      }
    }
  });

  test('logging a 25-min steady Bike through the sheet shows it in the recent list', async ({
    api,
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();
    await pages.health.navigate();
    await expect(pages.health.workoutsCard).toBeVisible();

    // The Bike quick-log chip opens the sheet prefiltered to Bike.
    await pages.health.workoutChip('Bike').click();
    await expect(pages.health.sheetMachineChip('Bike')).toHaveClass(/selected/);
    await expect(pages.health.sheetDuration).toHaveText('25 min');
    await expect(pages.health.sheetEffortChip('steady')).toHaveClass(/selected/);

    await pages.health.sheetSaveWorkout.click();
    await expect(pages.health.sheetSaveWorkout).toHaveCount(0);

    // The new row tops the recent list.
    await expect(pages.health.recentWorkoutRows.first()).toContainText('Bike · 25 min');

    // And the API agrees, including the effort-in-notes mapping.
    const today = localIsoDate();
    const rows = await api.listWorkouts(today, today);
    const created = rows.find(
      (w) => w.equipment === 'IndoorBike' && w.durationMinutes === 25,
    );
    expect(created).toBeDefined();
    expect(created!.notes).toBe('effort:steady');
  });

  test('the duration stepper moves in 5-minute steps', async ({
    pages,
    signInAsSeededUser,
    page,
  }) => {
    await signInAsSeededUser();
    await pages.health.navigate();

    await pages.health.workoutAdd.click();
    await expect(pages.health.sheetDuration).toHaveText('25 min');

    await pages.health.sheetDurationPlus.click();
    await expect(pages.health.sheetDuration).toHaveText('30 min');
    await pages.health.sheetDurationMinus.click();
    await pages.health.sheetDurationMinus.click();
    await expect(pages.health.sheetDuration).toHaveText('20 min');

    // Close without saving — backdrop click dismisses the sheet.
    await page.keyboard.press('Escape');
    await expect(pages.health.sheetSaveWorkout).toHaveCount(0);
  });
});
