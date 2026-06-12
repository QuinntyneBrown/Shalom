import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { LogMealRequest } from '../models/log-meal-request';
import { MealEntryDto } from '../models/meal-entry-dto';
import { IMealsService } from './meals.service.contract';

/**
 * Real HTTP `IMealsService`. Bound to `MEALS_SERVICE` in the application
 * composition root.
 */
@Injectable({ providedIn: 'root' })
export class MealsService implements IMealsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  log(req: LogMealRequest): Promise<MealEntryDto> {
    return firstValueFrom(
      this.http.post<MealEntryDto>(`${this.baseUrl}/api/meals`, req),
    );
  }

  list(from: string, to: string): Promise<MealEntryDto[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return firstValueFrom(
      this.http.get<MealEntryDto[]>(`${this.baseUrl}/api/meals`, { params }),
    );
  }
}
