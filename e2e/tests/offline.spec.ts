import { expect, localIsoDate, pinClock, test } from '../fixtures/sh-test';

/**
 * M7 offline UX — runs ONLY under `playwright.offline.config.ts` (the
 * built `e2e`-configuration bundle on :4200; `ng serve` never registers
 * the service worker).
 *
 * Sequence: sign in online → wait for the Angular SW to take the page →
 * one controlled reload so ngsw caches the app shell, `/api/today`, and
 * `/api/auth/me` → `context.setOffline(true)` → reload → the Today shell
 * renders from cache, the offline banner shows, and the mutation button
 * is disabled. A second offline reload with the clock re-pinned into the
 * evening proves the time-aware composition (band, countdown/elapsed
 * surfaces) derives CLIENT-side from the cached aggregate — the same
 * `appNow()` math that drives the fast elapsed timer.
 *
 * Pins: 14:30 is always the midday band (the morning→midday edge is
 * clamped to 9:00–14:00) and 18:30 always the evening band, regardless of
 * the seeded schedule (weekday 12:00–20:00, Sunday 13:30–20:30). Facts the
 * SERVER derived at request time (e.g. `windowOpen`) are cached as-is, so
 * the spec only asserts on client-derived presentation.
 */

test.describe('offline (service worker, production bundle)', () => {
  test('a reload while offline still renders Today from the ngsw cache', async ({
    page,
    context,
    pages,
    signInAsSeededUser,
  }) => {
    await pinClock(page, `${localIsoDate()}T14:30:00`);
    await signInAsSeededUser();

    // Wait for the service worker (registerWhenStable:30000) to activate…
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    // …then reload once ONLINE so this (now controlled) load flows through
    // ngsw and populates the app-shell + today/auth data caches.
    await page.reload();
    await expect(pages.today.greeting).toBeVisible({ timeout: 15_000 });
    await expect(pages.today.eatingWindow).toBeVisible();

    await context.setOffline(true);
    await page.reload();

    // Shell + cached aggregate render; the banner names the state calmly.
    await expect(pages.today.greeting).toBeVisible({ timeout: 20_000 });
    await expect(pages.today.greeting).toContainText('Good afternoon');
    await expect(pages.today.statusPill).toBeVisible();
    await expect(page.locator('[data-testid="sh-offline-banner"]')).toContainText(
      "You're offline — Shalom will catch up when you're back.",
    );

    // Writes are online-only: the eating-window mutation button is disabled.
    await expect(pages.today.eatingWindow).toBeVisible();
    await expect(pages.today.logMeal).toBeDisabled();

    // Client-derived time facts keep moving on the CACHED aggregate: the
    // same data renders the evening composition once the clock says 18:30
    // (band + live countdown/elapsed all come from appNow(), not the
    // server). One of the two live fasting surfaces must be on screen.
    await pinClock(page, `${localIsoDate()}T18:30:00`);
    await page.reload();
    await expect(pages.today.greeting).toBeVisible({ timeout: 20_000 });
    await expect(pages.today.greeting).toContainText('Good evening');
    await expect(
      pages.today.windowClosing.or(pages.today.fastingCard).first(),
    ).toBeVisible();
    await expect(page.locator('[data-testid="sh-offline-banner"]')).toBeVisible();

    // Back online: the banner clears without a reload (online event → signal).
    await context.setOffline(false);
    await expect(page.locator('[data-testid="sh-offline-banner"]')).toHaveCount(0);
  });

  test('the manifest, icons, and ngsw worker are served by the production bundle', async ({
    page,
    request,
    signInAsSeededUser,
  }) => {
    await signInAsSeededUser();

    // Manifest linked and well-formed.
    const manifestHref = await page
      .locator('link[rel="manifest"]')
      .getAttribute('href');
    expect(manifestHref).toBe('manifest.webmanifest');
    const manifest = await (await request.get('/manifest.webmanifest')).json();
    expect(manifest.name).toBe('Shalom');
    expect(manifest.start_url).toBe('/today');
    expect(manifest.display).toBe('standalone');

    // Icons + worker respond 200.
    for (const asset of [
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/icons/icon-maskable-512.png',
      '/apple-touch-icon.png',
      '/favicon.png',
      '/ngsw-worker.js',
      '/ngsw.json',
    ]) {
      const res = await request.get(asset);
      expect(res.status(), asset).toBe(200);
    }

    // The worker actually controls the page.
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    await page.reload();
    expect(
      await page.evaluate(() => navigator.serviceWorker.controller !== null),
    ).toBe(true);
  });
});
