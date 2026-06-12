/**
 * Pure formatting helpers for the People surfaces. The server decides every
 * connection FACT (who is due, the daily nudge, daysUntil — ADR-004); these
 * helpers only turn already-derived dates into friendly captions and build
 * the sms:/tel: quick-action hrefs.
 */

/** Uppercase initial for the avatar circle. */
export function initialOf(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase();
}

/** Whole days from `fromIso` to `toIso` (both `yyyy-MM-dd`; positive when `toIso` is later). */
export function daysBetweenIso(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/**
 * "connected today" / "yesterday" / "X days ago", or null when never
 * connected. Grace-forward: a long gap is stated plainly, never as
 * "overdue".
 */
export function lastContactLabel(lastContactedOn: string | null, todayIso: string): string | null {
  if (!lastContactedOn) return null;
  const days = daysBetweenIso(lastContactedOn, todayIso);
  if (days <= 0) return 'connected today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

/** "Wife · connected today" / "Friend · 12 days ago" / "Wife · –" / "–". */
export function personCaption(
  relationship: string | null,
  lastContactedOn: string | null,
  todayIso: string,
): string {
  const contact = lastContactLabel(lastContactedOn, todayIso) ?? '–';
  return relationship ? `${relationship} · ${contact}` : contact;
}

/** `sms:` quick action with a short, warm draft (UX spec: prompt-ish, never guilt). */
export function smsHref(phone: string, name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? name;
  return `sms:${phone}&body=${encodeURIComponent(`Hey ${first} — thinking of you.`)}`;
}

export function telHref(phone: string): string {
  return `tel:${phone}`;
}

/** "today" / "tomorrow" / "in N days" for a derived daysUntil. */
export function daysUntilLabel(daysUntil: number): string {
  if (daysUntil <= 0) return 'today';
  if (daysUntil === 1) return 'tomorrow';
  return `in ${daysUntil} days`;
}
