import { InjectionToken } from '@angular/core';

import { LogMealRequest } from '../models/log-meal-request';
import { MealEntryDto } from '../models/meal-entry-dto';

/** HTTP boundary for `/api/meals` — patterns, not calories. */
export interface IMealsService {
  log(req: LogMealRequest): Promise<MealEntryDto>;
  /** Meals with `from <= localDay(occurredAt) <= to` (both `yyyy-MM-dd`), newest first. */
  list(from: string, to: string): Promise<MealEntryDto[]>;
}

export const MEALS_SERVICE = new InjectionToken<IMealsService>('MEALS_SERVICE');
