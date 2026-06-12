import { FastingSessionDto } from './fasting-session-dto';
import { TodayWindowDto } from './today-window-dto';

/**
 * Fasting pillar of the Today aggregate: the open session (if any), today's
 * eating window, whether "now" sits inside it (computed server-side in the
 * schedule's timezone, ADR-004), and today's target hours.
 */
export interface TodayFastingDto {
  readonly current: FastingSessionDto | null;
  readonly todayWindow: TodayWindowDto;
  readonly windowOpen: boolean;
  readonly targetHours: number;
}
