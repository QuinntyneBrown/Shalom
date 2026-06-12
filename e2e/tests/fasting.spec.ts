import { addDaysIso } from '../helpers/dates';
import { expect, localIsoDate, test } from '../fixtures/sh-test';

test.describe('fasting', () => {
  test.beforeEach(async ({ api }) => {
    // The design has no explicit start button on Health (ADR-005:
    // schedule-first) — fasts are started via the API; the UI's job is to
    // show and end them. Reset to a clean state first.
    await api.ensureNoOpenFast();
  });

  test('an open fast shows live on Health, and ending it from the detail page lands in history', async ({
    api,
    page,
    pages,
    signInAsSeededUser,
  }) => {
    const started = await api.startFast();

    await signInAsSeededUser();
    await pages.health.navigate();

    // Health summary card: status pill, ring, live elapsed, window line.
    await expect(pages.health.statusPill).toContainText(/Fasting · \d+h \d+m/);
    await expect(pages.health.fastingRing).toBeVisible();
    await expect(pages.health.fastingElapsed).toHaveText(/^\d+h \d+m$/);
    await expect(pages.health.fastingWindow).toContainText(/^Window opens \d{2}:\d{2}$/);
    await expect(pages.health.fastingTarget).toHaveText('16:8');

    // Into the detail page.
    await pages.health.detailLink.click();
    await expect(page).toHaveURL(/\/health\/fasting$/);
    await expect(pages.fastDetail.ring).toBeVisible();
    await expect(pages.fastDetail.elapsed).toHaveText(/^\d+h \d+m$/);
    await expect(pages.fastDetail.started).toContainText(/^Started /);
    await expect(pages.fastDetail.window).toContainText(/^Window opens \d{2}:\d{2} · closes \d{2}:\d{2}$/);

    // End it through the grace-forward confirmation.
    await pages.fastDetail.endFast();

    await expect(pages.fastDetail.none).toHaveText('No fast running');
    await expect(pages.fastDetail.endButton).toHaveCount(0);

    // History reflects the derived outcome (seconds elapsed => EndedEarly).
    const history = await api.fastingHistory(
      addDaysIso(localIsoDate(), -1),
      addDaysIso(localIsoDate(), 1),
    );
    const ended = history.find((s) => s.id === started.id);
    expect(ended).toBeDefined();
    expect(ended!.endedAt).not.toBeNull();
    expect(ended!.outcome).toBe('EndedEarly');
  });

  test('with no fast running, Health shows the quiet eating-window state and the schedule card', async ({
    pages,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();
    await pages.health.navigate();

    await expect(pages.health.statusPill).toContainText('Eating window');
    await expect(pages.health.fastingElapsed).toHaveText('Not fasting');

    await pages.health.detailLink.click();
    await expect(pages.fastDetail.none).toBeVisible();
    await expect(pages.fastDetail.scheduleCard).toBeVisible();
    await expect(pages.fastDetail.scheduleDefault).toContainText('Mon – Sat');
    await expect(pages.fastDetail.scheduleDefault).toContainText('12:00 – 20:00');
    await expect(pages.fastDetail.scheduleSunday).toContainText('Sunday');
    await expect(pages.fastDetail.scheduleSunday).toContainText('13:30 – 20:30');
  });
});
