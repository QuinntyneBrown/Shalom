import { FastingScheduleDto } from './fasting-schedule-dto';
import { FastingSessionDto } from './fasting-session-dto';

/** `GET /api/fasting/current` — the fasting surface in one round trip. */
export interface CurrentFastDto {
  readonly current: FastingSessionDto | null;
  readonly schedule: FastingScheduleDto;
}
