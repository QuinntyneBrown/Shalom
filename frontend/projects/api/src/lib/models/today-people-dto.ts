import { ConnectionNudgeDto } from './connection-nudge-dto';
import { PrayerFocusDto } from './prayer-focus-dto';
import { UpcomingDateDto } from './upcoming-date-dto';

/**
 * Connection slice of the Today aggregate. At most ONE nudge per day, and
 * none at all once any contact was recorded today. Streaks never apply
 * here — relationships are invitations, not obligations. `prayerFocus` is
 * the morning ritual's deterministic daily focus (always present).
 */
export interface TodayPeopleDto {
  readonly nudge: ConnectionNudgeDto | null;
  readonly upcomingDates: UpcomingDateDto[];
  readonly prayerFocus: PrayerFocusDto;
}
