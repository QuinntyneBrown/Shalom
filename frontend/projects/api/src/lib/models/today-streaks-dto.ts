/** Derived streaks (ADR-004: computed server-side at read time, never stored). */
export interface TodayStreaksDto {
  readonly checkInCurrent: number;
  readonly checkInLongest: number;
  readonly readingCurrent: number;
  readonly readingLongest: number;
}
