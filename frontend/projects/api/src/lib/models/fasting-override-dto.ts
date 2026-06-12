/** Weekday name as serialized by the API ("Sunday" … "Saturday"). */
export type WeekdayName =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

/**
 * Per-weekday eating-window override (ADR-005: Sunday family lunch is a
 * first-class exception, not a streak-breaker). Times are `HH:mm:ss`.
 */
export interface FastingOverrideDto {
  readonly dayOfWeek: WeekdayName;
  readonly eatingWindowStart: string;
  readonly eatingWindowEnd: string;
}
