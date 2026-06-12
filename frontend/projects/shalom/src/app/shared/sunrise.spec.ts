import { isBeforeSunrise, sunriseAt, sunriseUtcMinutes } from './sunrise';

/**
 * Known-date checks for the embedded NOAA approximation, asserted in UTC so
 * the suite passes in any runner timezone. Toronto reference values:
 *
 *   - June 21    sunrise ≈ 05:36 EDT = 09:36 UTC (576 min)
 *   - December 21 sunrise ≈ 07:48 EST = 12:48 UTC (768 min)
 *
 * The low-accuracy equations are good to a couple of minutes; the
 * assertions allow ±10.
 */
describe('sunriseUtcMinutes (Toronto)', () => {
  it('lands near 09:36 UTC on the June solstice', () => {
    const minutes = sunriseUtcMinutes(2026, 6, 21);
    expect(minutes).toBeGreaterThan(566);
    expect(minutes).toBeLessThan(586);
  });

  it('lands near 12:48 UTC on the December solstice', () => {
    const minutes = sunriseUtcMinutes(2026, 12, 21);
    expect(minutes).toBeGreaterThan(758);
    expect(minutes).toBeLessThan(778);
  });

  it('equinox sunrise sits between the solstice extremes', () => {
    const march = sunriseUtcMinutes(2026, 3, 20);
    expect(march).toBeGreaterThan(sunriseUtcMinutes(2026, 6, 21));
    expect(march).toBeLessThan(sunriseUtcMinutes(2026, 12, 21));
  });
});

describe('sunriseAt / isBeforeSunrise', () => {
  it('anchors the UTC minutes to the UTC midnight of the local calendar date', () => {
    // June 21 2026: sunrise ≈ 09:36 UTC.
    const sunrise = sunriseAt(new Date(2026, 5, 21, 12, 0, 0));
    expect(sunrise.getUTCFullYear()).toBe(2026);
    expect(sunrise.getUTCMonth()).toBe(5);
    expect(sunrise.getUTCDate()).toBe(21);
    expect(sunrise.getUTCHours()).toBe(9);
  });

  it('classifies instants strictly before/after the computed sunrise', () => {
    const noonLocal = new Date(2026, 5, 21, 12, 0, 0);
    const sunrise = sunriseAt(noonLocal);
    expect(isBeforeSunrise(new Date(sunrise.getTime() - 60_000))).toBe(true);
    expect(isBeforeSunrise(new Date(sunrise.getTime() + 60_000))).toBe(false);
  });
});
