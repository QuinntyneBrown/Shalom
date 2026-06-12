/**
 * Local sunrise via the NOAA solar-position approximation — small enough to
 * embed, accurate to a couple of minutes at Toronto's latitude, and zero
 * dependencies. Drives the dawn theme: before sunrise the app wears the dim
 * warm palette (`.sh-dawn`).
 *
 * Reference: NOAA Global Monitoring Division "Solar Calculation Details"
 * (the low-accuracy equations: fractional year → equation of time + solar
 * declination → sunrise hour angle at zenith 90.833°).
 */

export const TORONTO_LAT = 43.55;
export const TORONTO_LON = -79.58;

const RAD = Math.PI / 180;
/** Official sunrise zenith: 90° + atmospheric refraction + solar radius. */
const SUNRISE_ZENITH_DEG = 90.833;

/** Day of year (1-based) for a local calendar date. */
function dayOfYear(year: number, month: number, day: number): number {
  const start = Date.UTC(year, 0, 1);
  const date = Date.UTC(year, month - 1, day);
  return Math.round((date - start) / 86_400_000) + 1;
}

/**
 * Sunrise as minutes after UTC midnight of the given local calendar date.
 * Pure math, no Date/timezone involvement — the unit-testable core.
 */
export function sunriseUtcMinutes(
  year: number,
  month: number,
  day: number,
  lat: number = TORONTO_LAT,
  lon: number = TORONTO_LON,
): number {
  const n = dayOfYear(year, month, day);
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const gamma = ((2 * Math.PI) / (leap ? 366 : 365)) * (n - 1 + 0.5);

  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const latRad = lat * RAD;
  const cosHa =
    Math.cos(SUNRISE_ZENITH_DEG * RAD) / (Math.cos(latRad) * Math.cos(decl)) -
    Math.tan(latRad) * Math.tan(decl);
  // Polar edge cases (|cosHa| > 1) cannot happen at Toronto; clamp defensively.
  const haDeg = (Math.acos(Math.min(1, Math.max(-1, cosHa))) / RAD);

  return 720 - 4 * (lon + haDeg) - eqTime;
}

/**
 * Sunrise for the local calendar date of `date` as a real `Date` (the UTC
 * minutes anchored to that date's UTC midnight — comparing it against "now"
 * in any timezone is therefore exact).
 */
export function sunriseAt(date: Date, lat: number = TORONTO_LAT, lon: number = TORONTO_LON): Date {
  const minutes = sunriseUtcMinutes(date.getFullYear(), date.getMonth() + 1, date.getDate(), lat, lon);
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return new Date(utcMidnight + Math.round(minutes * 60_000));
}

/** True when `now` is before the local sunrise of its own calendar date. */
export function isBeforeSunrise(now: Date, lat: number = TORONTO_LAT, lon: number = TORONTO_LON): boolean {
  return now.getTime() < sunriseAt(now, lat, lon).getTime();
}
