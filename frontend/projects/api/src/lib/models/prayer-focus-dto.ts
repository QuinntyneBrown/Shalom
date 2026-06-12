/**
 * Today's prayer focus for the morning ritual — a deterministic server-side
 * rotation over the active people plus two fixed focuses ("your church",
 * "FaithTech") keyed by day-of-year. `line` is the warm one-sentence framing
 * for the focus; `tomorrowName` powers the evening "Tomorrow" glance without
 * a second round trip. Names always come from data, never hardcoded.
 */
export interface PrayerFocusDto {
  readonly name: string;
  readonly line: string;
  readonly tomorrowName: string;
}
