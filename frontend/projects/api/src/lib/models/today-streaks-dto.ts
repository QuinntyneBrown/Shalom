/**
 * Derived streaks (ADR-004: computed server-side at read time, never
 * stored). Fasting days are the local dates completed fasts ended on;
 * movement days are the local dates workouts started on.
 */
export interface TodayStreaksDto {
  readonly checkInCurrent: number;
  readonly checkInLongest: number;
  readonly readingCurrent: number;
  readonly readingLongest: number;
  readonly fastingCurrent: number;
  readonly fastingLongest: number;
  readonly movementCurrent: number;
  readonly movementLongest: number;
}
