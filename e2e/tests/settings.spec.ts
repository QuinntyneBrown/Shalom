import { expect, test } from '../fixtures/sh-test';

/**
 * Settings → RHYTHM → fasting schedule: the M8 round-trip. The sheet PUTs
 * the whole schedule (`PUT /api/fasting/schedule`); the spec proves the
 * response updates the row, the server persisted it, and a FRESH load of
 * Today derives its window from the new schedule.
 *
 * Repeat-safety: the original schedule is captured first and restored via
 * the API in a `finally` — other specs assert the seeded 12:00–20:00 /
 * Sunday 13:30–20:30 windows.
 */
test.describe('settings — fasting schedule', () => {
  test.beforeEach(async ({ api }) => {
    // A running fast changes the Today status pill shape; start clean.
    await api.ensureNoOpenFast();
  });

  test('editing the schedule round-trips: PUT applies and the Today window updates', async ({
    api,
    page,
    pages,
    signInAsSeededUser,
  }) => {
    const original = (await api.getCurrentFast()).schedule;
    const newTarget = original.targetFastHours >= 23 ? 22 : original.targetFastHours + 1;

    try {
      await signInAsSeededUser();
      await pages.settings.navigate();
      await expect(pages.settings.heading).toBeVisible();
      await expect(pages.settings.fastingRow).toContainText(
        `${original.targetFastHours}:${24 - original.targetFastHours}`,
      );

      // The sheet opens pre-filled from the live schedule.
      await pages.settings.fastingRow.click();
      await expect(pages.settings.sheetScheduleStart).toHaveValue(
        original.eatingWindowStart.slice(0, 5),
      );
      await expect(pages.settings.sheetScheduleSundayToggle).toHaveAttribute(
        'aria-checked',
        'true', // the seeded Sunday override is a first-class row (ADR-005)
      );

      // Move BOTH edges on BOTH the weekday window and the Sunday override
      // (11:15–19:45), so today's computed window moves no matter which day
      // the suite runs — and whichever status-pill branch renders (the
      // server derives `windowOpen` from REAL time, not the pinned clock)
      // contains one of the two new times.
      await pages.settings.sheetScheduleStart.fill('11:15');
      await pages.settings.sheetScheduleEnd.fill('19:45');
      await pages.settings.sheetScheduleSundayStart.fill('11:15');
      await pages.settings.sheetScheduleSundayEnd.fill('19:45');
      if (newTarget > original.targetFastHours) {
        await pages.settings.sheetScheduleTargetPlus.click();
      } else {
        await pages.settings.sheetScheduleTargetMinus.click();
      }
      await expect(pages.settings.sheetScheduleTarget).toHaveText(`${newTarget}h`);

      await pages.settings.sheetSaveSchedule.click();
      // The sheet closes on a successful PUT…
      await expect(pages.settings.sheetSaveSchedule).toHaveCount(0);
      // …and the row reflects the response.
      await expect(pages.settings.fastingRow).toContainText(
        `${newTarget}:${24 - newTarget}`,
      );

      // Server state: persisted wholesale, overrides intact, today's
      // computed window already derived from the new schedule.
      const persisted = (await api.getCurrentFast()).schedule;
      expect(persisted.eatingWindowStart).toBe('11:15:00');
      expect(persisted.eatingWindowEnd).toBe('19:45:00');
      expect(persisted.targetFastHours).toBe(newTarget);
      expect(persisted.todayWindow.start).toBe('11:15:00');
      expect(persisted.todayWindow.end).toBe('19:45:00');
      expect(
        persisted.overrides.find((o) => o.dayOfWeek === 'Sunday')?.eatingWindowStart,
      ).toBe('11:15:00');

      // A FRESH page load of Today (not the in-memory store) derives the
      // new window. The pill renders "Window opens 11:15" or "Window
      // open · closes 19:45" depending on the server-real `windowOpen`;
      // both carry a time that only exists in the NEW schedule.
      await page.goto('/today');
      await expect(pages.today.greeting).toBeVisible({ timeout: 15_000 });
      await expect(pages.today.statusPill).toContainText(/11:15|19:45/);
    } finally {
      await api.updateSchedule({
        windowStart: original.eatingWindowStart,
        windowEnd: original.eatingWindowEnd,
        targetFastHours: original.targetFastHours,
        overrides: original.overrides,
      });
    }
  });
});
