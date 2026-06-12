import { ConnectionNudgeDto } from './connection-nudge-dto';
import { UpcomingDateDto } from './upcoming-date-dto';

/**
 * Connection slice of the Today aggregate. At most ONE nudge per day, and
 * none at all once any contact was recorded today. Streaks never apply
 * here — relationships are invitations, not obligations.
 */
export interface TodayPeopleDto {
  readonly nudge: ConnectionNudgeDto | null;
  readonly upcomingDates: UpcomingDateDto[];
}
