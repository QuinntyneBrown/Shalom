import { InjectionToken } from '@angular/core';

import { CurrentFastDto } from '../models/current-fast-dto';
import { FastingScheduleDto } from '../models/fasting-schedule-dto';
import { FastingSessionDto } from '../models/fasting-session-dto';
import { StartFastRequest } from '../models/start-fast-request';
import { UpdateFastingScheduleRequest } from '../models/update-fasting-schedule-request';

/**
 * HTTP boundary for `/api/fasting/*` (ADR-005: schedule-first; sessions
 * explicit; outcome derived server-side, never stored).
 */
export interface IFastingService {
  /** Open session + schedule with today's window. Lazily creates the default schedule. */
  getCurrent(): Promise<CurrentFastDto>;
  /** Starts a fast now. The server rejects (409) when one is already open. */
  start(req?: StartFastRequest): Promise<FastingSessionDto>;
  /** Ends the open fast now; the result carries the derived outcome. */
  end(): Promise<FastingSessionDto>;
  /** Sessions overlapping `from <= localDay <= to` (both `yyyy-MM-dd`). */
  history(from: string, to: string): Promise<FastingSessionDto[]>;
  updateSchedule(req: UpdateFastingScheduleRequest): Promise<FastingScheduleDto>;
}

export const FASTING_SERVICE = new InjectionToken<IFastingService>('FASTING_SERVICE');
