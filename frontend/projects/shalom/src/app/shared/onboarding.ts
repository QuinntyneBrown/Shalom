/**
 * Device-local onboarding facts (no backend):
 *
 *   - `sh.onboarded` — set to `'1'` once the welcome flow finishes; the
 *     welcome screens never auto-show again (Settings offers a replay).
 *   - `sh.wakeTime` — the "I usually wake at" answer from welcome step 2,
 *     stored as `HH:mm` (24h). Display-only everywhere else (Settings).
 */

const ONBOARDED_KEY = 'sh.onboarded';
const WAKE_TIME_KEY = 'sh.wakeTime';

export const DEFAULT_WAKE_TIME = '06:00';

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOnboarded(): void {
  try {
    localStorage.setItem(ONBOARDED_KEY, '1');
  } catch {
    // Storage unavailable — the flow may show again; harmless.
  }
}

/** `HH:mm` (24h), defaulting to a 6:00 morning. */
export function readWakeTime(): string {
  try {
    const value = localStorage.getItem(WAKE_TIME_KEY);
    return value && /^\d{2}:\d{2}$/.test(value) ? value : DEFAULT_WAKE_TIME;
  } catch {
    return DEFAULT_WAKE_TIME;
  }
}

export function writeWakeTime(hhmm: string): void {
  try {
    localStorage.setItem(WAKE_TIME_KEY, hhmm);
  } catch {
    // Storage unavailable; the in-memory signal still drives the UI.
  }
}

/** "6:00 AM" from "06:00" (the welcome card's display voice). */
export function formatWakeDisplay(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "6:00" from "06:00" (the Settings row's compact voice). */
export function formatWakeShort(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h}:${String(m).padStart(2, '0')}`;
}
