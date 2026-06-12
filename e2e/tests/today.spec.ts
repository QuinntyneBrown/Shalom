import { expect, test } from '../fixtures/sh-test';

/**
 * The soul of the product: the 6am, two-minute morning. The fixture pins
 * the app clock to 08:00 local (morning band); the database day is the real
 * local day, so server-derived facts line up.
 *
 * Repeat-safety: today's surfaced reading is uncompleted via the API first,
 * which also flips `ritualCompletedToday` back to false (the check-in
 * upsert is idempotent), so the hero is always there to begin from.
 */
test.describe('today — morning ritual flow', () => {
  test.beforeEach(async ({ api }) => {
    const today = await api.getToday();
    if (today.reading?.completedToday) {
      await api.uncompleteDay(today.reading.dayId);
    }
  });

  test('Begin → check-in → scripture → prayer → day preview → Shalom. → morning complete', async ({
    api,
    page,
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();

    // Morning band: greeting + status pill + the ritual hero.
    await expect(pages.today.statusPill).toBeVisible();
    await expect(pages.today.ritualHero).toBeVisible();
    await expect(pages.today.ritualHero).toContainText('Begin your morning');
    await expect(pages.today.ritualHero).toContainText('about 2 minutes');

    await pages.today.beginRitual();
    await expect(page).toHaveURL(/\/today\/ritual$/);

    // Step 1 — check-in: Steady + closeness 3, then Continue (optimistic save).
    await expect(pages.ritual.stepCheckIn).toContainText('How is your soul this morning?');
    await pages.ritual.completeCheckIn('Steady', 3, 'e2e: morning ritual');

    // Step 2 — scripture: verse of the day + today's reading + YouVersion.
    await expect(pages.ritual.stepScripture).toBeVisible();
    await expect(pages.ritual.verseText).not.toBeEmpty();
    await expect(pages.ritual.verseReference).toContainText('WEB');
    await expect(pages.ritual.youVersionLink).toHaveAttribute(
      'href',
      /^https:\/\/www\.bible\.com\/bible\/111\//,
    );
    await expect(pages.ritual.youVersionLink).toHaveAttribute('target', '_blank');
    await expect(pages.ritual.markReadButton).toContainText('Mark read · Continue');
    await pages.ritual.markReadButton.click();

    // Step 3 — prayer focus: a name from data plus its framing line.
    await expect(pages.ritual.stepPrayer).toBeVisible();
    await expect(pages.ritual.focusName).not.toBeEmpty();
    await expect(pages.ritual.focusLine).not.toBeEmpty();
    await pages.ritual.amenButton.click();

    // Step 4 — the day, gently: window, movement intention, connection.
    await expect(pages.ritual.stepPreview).toContainText('Your day, gently');
    await expect(pages.ritual.previewWindow).toContainText(/Opens \d{2}:\d{2} · closes \d{2}:\d{2}/);
    await pages.ritual.intentionChip('IndoorBike').click();
    await expect(pages.ritual.previewMovement).toContainText('Bike — 20 minutes, when it fits');
    await pages.ritual.doneButton.click();

    // Completion: Shalom. — tap anywhere to close.
    await expect(pages.ritual.complete).toContainText('Shalom.');
    await expect(pages.ritual.complete).toContainText('Go in peace. The day is ready for you.');
    await expect(pages.ritual.complete).toContainText('tap anywhere to close');

    // Streak badges only exist from the third completed morning on.
    const after = await api.getToday();
    expect(after.ritualCompletedToday).toBe(true);
    if (after.streaks.checkInCurrent >= 3) {
      await expect(pages.ritual.dayBadge).toContainText(
        `Day ${after.streaks.checkInCurrent} with you`,
      );
    } else {
      await expect(pages.ritual.dayBadge).toHaveCount(0);
    }

    await pages.ritual.complete.click();
    await expect(page).toHaveURL(/\/today$/);

    // The hero has made way for the compact morning-complete card.
    await expect(pages.today.ritualHero).toHaveCount(0);
    await expect(pages.today.morningComplete).toBeVisible();
    await expect(pages.today.morningComplete).toContainText('Morning complete');
    await expect(pages.today.morningComplete).toContainText('felt Steady');

    if (after.streaks.checkInCurrent >= 3) {
      await expect(pages.today.streaks).toBeVisible();
      await expect(pages.today.streaks).toContainText(
        `${after.streaks.checkInCurrent}-day check-in rhythm`,
      );
    } else {
      await expect(pages.today.streaks).toHaveCount(0);
    }
  });

  test('closing the ritual early keeps the partial progress', async ({
    api,
    page,
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();
    await pages.today.ritualBegin.click();

    await pages.ritual.completeCheckIn('Full', 4);
    await expect(pages.ritual.stepScripture).toBeVisible();

    // X out at scripture — the step-1 check-in is already saved.
    await pages.ritual.close.click();
    await expect(page).toHaveURL(/\/today$/);

    const today = await api.getToday();
    expect(today.checkIn).not.toBeNull();
    // The reading was never marked, so the morning is honestly incomplete.
    expect(today.ritualCompletedToday).toBe(false);
    await expect(pages.today.ritualHero).toBeVisible();
  });

  test('a chosen movement intention survives reloads for the rest of the day', async ({
    page,
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();

    await pages.today.intentionChip('Elliptical').click();
    await expect(pages.today.intentionChip('Elliptical')).toHaveClass(/selected/);

    await page.reload();
    await expect(pages.today.greeting).toBeVisible({ timeout: 15_000 });
    await expect(pages.today.intentionChip('Elliptical')).toHaveClass(/selected/);
  });
});
