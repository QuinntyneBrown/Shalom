/**
 * The reading pillar's slice of `TodayDto`: the current day of the active
 * plan — the most recent day completed today, or else the first uncompleted
 * day.
 */
export interface TodayReadingDto {
  readonly dayId: string;
  readonly dayNumber: number;
  readonly passageReference: string;
  readonly youVersionUrl: string;
  readonly completedToday: boolean;
  readonly planName: string;
  readonly completedCount: number;
  readonly totalDays: number;
  /**
   * Tomorrow's likely passage for the evening glance — the first
   * still-uncompleted day (today's while it isn't done), or null when the
   * plan would be finished.
   */
  readonly nextPassageReference: string | null;
}
