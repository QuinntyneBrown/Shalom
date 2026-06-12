import { InjectionToken } from '@angular/core';

import { TodayDto } from '../models/today-dto';

/**
 * HTTP boundary for `GET /api/today` — the one-round-trip dashboard
 * aggregate. Pages inject the token, never the concrete class.
 */
export interface ITodayService {
  getToday(): Promise<TodayDto>;
}

export const TODAY_SERVICE = new InjectionToken<ITodayService>('TODAY_SERVICE');
