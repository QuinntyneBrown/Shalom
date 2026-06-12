import { TodayWindowDto } from 'api';

/**
 * The four moods of the Today surface. Fixed edges: morning begins 4:30,
 * night begins 22:00 (the app models rest, not hustle — no CTAs after
 * that). The morning→midday edge prefers the day's real eating window
 * ("window opens" copy belongs to midday), falling back to 11:00; evening
 * starts at 17:00.
 */
export type TimeBand = 'morning' | 'midday' | 'evening' | 'night';

export const MORNING_START_MIN = 4 * 60 + 30;
export const NIGHT_START_MIN = 22 * 60;
export const EVENING_START_MIN = 17 * 60;
const DEFAULT_WINDOW_OPEN_MIN = 11 * 60;

export function timeBand(now: Date, window?: TodayWindowDto | null): TimeBand {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes >= NIGHT_START_MIN || minutes < MORNING_START_MIN) return 'night';

  const open = window ? (parseTimeMinutes(window.start) ?? DEFAULT_WINDOW_OPEN_MIN) : DEFAULT_WINDOW_OPEN_MIN;
  // The edge follows the real window but stays inside 9:00–14:00 so an
  // unusual schedule never squeezes morning or midday out of existence.
  const middayStart = Math.min(Math.max(open, 9 * 60), 14 * 60);

  if (minutes < middayStart) return 'morning';
  if (minutes < EVENING_START_MIN) return 'midday';
  return 'evening';
}

/** Minutes since local midnight for an API `TimeOnly` string ("HH:mm[:ss]"), or null when malformed. */
export function parseTimeMinutes(time: string): number | null {
  const match = /^(\d{2}):(\d{2})/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Minutes from `now` until a local wall-clock `TimeOnly` today (negative when it has passed). */
export function minutesUntil(now: Date, time: string): number | null {
  const target = parseTimeMinutes(time);
  if (target === null) return null;
  return target - (now.getHours() * 60 + now.getMinutes());
}

/** "6h 13m" / "40 minutes" style countdown copy for the eating-window cards. */
export function countdownLabel(totalMinutes: number): string {
  const clamped = Math.max(0, totalMinutes);
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  if (hours === 0) return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  return `${hours}h ${minutes}m`;
}
