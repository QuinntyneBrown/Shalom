/**
 * Today's eating window (local wall-clock times, `HH:mm:ss`), already
 * honoring any weekday override — computed server-side per ADR-004.
 */
export interface TodayWindowDto {
  readonly start: string;
  readonly end: string;
}
