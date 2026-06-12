import { InjectionToken } from '@angular/core';

import { CheckInDto } from '../models/check-in-dto';
import { UpsertCheckInRequest } from '../models/upsert-check-in-request';

/**
 * HTTP boundary for `/api/check-ins/*`. `upsertToday` carries no date —
 * the server derives "today" in America/Toronto (ADR-004).
 */
export interface ICheckInsService {
  upsertToday(req: UpsertCheckInRequest): Promise<CheckInDto>;
  /** Lists check-ins with `from <= date <= to` (both `yyyy-MM-dd`). */
  list(from: string, to: string): Promise<CheckInDto[]>;
}

export const CHECK_INS_SERVICE = new InjectionToken<ICheckInsService>('CHECK_INS_SERVICE');
