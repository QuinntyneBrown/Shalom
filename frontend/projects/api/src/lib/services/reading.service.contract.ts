import { InjectionToken } from '@angular/core';

import { ReadingDayDto } from '../models/reading-day-dto';
import { ReadingPlanDto } from '../models/reading-plan-dto';

/**
 * HTTP boundary for `/api/reading/*`. Completion is idempotent on the
 * server: completing an already-completed day is a no-op success.
 */
export interface IReadingService {
  getPlan(): Promise<ReadingPlanDto>;
  completeDay(dayId: string): Promise<ReadingDayDto>;
  uncompleteDay(dayId: string): Promise<void>;
}

export const READING_SERVICE = new InjectionToken<IReadingService>('READING_SERVICE');
