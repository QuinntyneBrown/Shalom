import { FastingOverrideDto } from './fasting-override-dto';
import { TodayWindowDto } from './today-window-dto';

/**
 * The schedule-first fasting configuration (ADR-005) plus the computed
 * window for the server-derived local day. Times are `HH:mm:ss`.
 */
export interface FastingScheduleDto {
  readonly eatingWindowStart: string;
  readonly eatingWindowEnd: string;
  readonly targetFastHours: number;
  /** IANA id, e.g. "America/Toronto". */
  readonly timeZoneId: string;
  readonly overrides: FastingOverrideDto[];
  readonly todayWindow: TodayWindowDto;
}
