/**
 * Pure formatting/date helpers for the health surfaces. Server-derived
 * facts (today's window, outcomes, streaks) stay authoritative (ADR-004);
 * these helpers only render timestamps in the viewer's local time and
 * drive the LIVE elapsed ticker between server round trips.
 */

/** "11h 24m" from milliseconds (floored, never negative). */
export function formatElapsed(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

/** "HH:mm" from an API TimeOnly string ("HH:mm:ss[.fffffff]"). */
export function formatWindowTime(time: string): string {
  return time.slice(0, 5);
}

/** `yyyy-MM-dd` for a Date in the browser's local timezone. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Browser-local calendar date (`yyyy-MM-dd`) of an ISO timestamp. */
export function localDateOf(iso: string): string {
  return toIsoDate(new Date(iso));
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Monday of the week containing `d` (browser-local; Monday-first weeks). */
export function mondayOf(d: Date): Date {
  const copy = new Date(d);
  const offset = (copy.getDay() + 6) % 7; // Sun=0 → 6, Mon=1 → 0, …
  copy.setDate(copy.getDate() - offset);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** "today 8:36 PM" / "yesterday 8:36 PM" / "Jun 9, 8:36 PM" for a start timestamp. */
export function formatStarted(iso: string, now: Date = new Date()): string {
  const started = new Date(iso);
  const time = started.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const day = toIsoDate(started);
  if (day === toIsoDate(now)) return `today ${time}`;
  if (day === toIsoDate(addDays(now, -1))) return `yesterday ${time}`;
  const date = started.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${date}, ${time}`;
}
