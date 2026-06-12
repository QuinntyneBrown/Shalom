import { expect, test } from '../fixtures/sh-test';

/**
 * Settings → REMINDERS → Nudges sheet (M10) — the pragmatic slice of web
 * push that headless Chromium under `ng serve` can honestly verify.
 *
 * What CAN be covered here: the row, the sheet, its whisper copy, and the
 * graceful "can't push" path. The dev server runs WITHOUT the Angular
 * service worker (`provideServiceWorker` is `!isDevMode()`-guarded), so
 * `SwPush.isEnabled` is false and the sheet must land in its calm
 * unsupported state — which is exactly the UX rule under test: Shalom
 * stays fully functional when push is unavailable or denied.
 *
 * What CANNOT: a real `PushManager.subscribe` round-trip. Even with
 * `context.grantPermissions(['notifications'])` (which Playwright DOES
 * support for Chromium and is exercised below), subscribing needs the
 * production service worker AND a push-service-reachable VAPID setup;
 * the real-device verification is the owner's installed-iPhone step.
 * See e2e/README.md → "Push reminders spec".
 */
test.describe('settings — reminders (nudges sheet)', () => {
  test('the nudges row reads off and opens the sheet with the whisper copy', async ({
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();
    await pages.settings.navigate();
    await expect(pages.settings.heading).toBeVisible();

    // The row is calm: a choice that currently reads "off".
    await expect(pages.settings.nudgesRow).toContainText('Nudges');
    await expect(pages.settings.nudgesRow).toContainText('off');

    await pages.settings.nudgesRow.click();

    // The sheet explains the only 2–3 moments Shalom will ever tap for.
    await expect(pages.settings.sheetRemindersCopy).toContainText(
      'A tap on the shoulder when your window opens',
    );
    await expect(pages.settings.sheetRemindersCopy).toContainText(
      "a week's notice for the dates that matter",
    );
  });

  test('without a service worker the sheet stays graceful and the app stays whole', async ({
    context,
    pages,
    signInAsSeededUser,
  }) => {
    // Granting the permission up front changes nothing in dev mode — the
    // point: no push capability ever degrades the app.
    await context.grantPermissions(['notifications']);

    await signInAsSeededUser();
    await pages.settings.navigate();
    await pages.settings.nudgesRow.click();

    // No enable tap is offered where it could only fail loudly…
    await expect(pages.settings.sheetRemindersStatus).toContainText('Home Screen');
    await expect(pages.settings.sheetRemindersEnable).toHaveCount(0);

    // …and "Okay" closes the sheet; settings (and the app) carry on.
    await pages.settings.sheetRemindersClose.click();
    await expect(pages.settings.sheetRemindersClose).toHaveCount(0);
    await expect(pages.settings.nudgesRow).toContainText('off');

    // Today still loads — fully functional without push.
    await pages.today.navigate();
    await expect(pages.today.greeting).toBeVisible();
  });
});
