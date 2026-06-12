import { FastingOverrideDto } from './fasting-override-dto';

/** Body for `PUT /api/fasting/schedule`. Overrides replace the existing set wholesale. */
export interface UpdateFastingScheduleRequest {
  /** `HH:mm:ss` local wall-clock time. */
  readonly windowStart: string;
  readonly windowEnd: string;
  /** 12–23 hours. */
  readonly targetFastHours: number;
  readonly overrides: FastingOverrideDto[];
}
