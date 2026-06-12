import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { ReadingDayDto } from '../models/reading-day-dto';
import { ReadingPlanDto } from '../models/reading-plan-dto';
import { IReadingService } from './reading.service.contract';

/**
 * Real HTTP `IReadingService`. Bound to `READING_SERVICE` in the
 * application composition root.
 */
@Injectable({ providedIn: 'root' })
export class ReadingService implements IReadingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getPlan(): Promise<ReadingPlanDto> {
    return firstValueFrom(
      this.http.get<ReadingPlanDto>(`${this.baseUrl}/api/reading/plan`),
    );
  }

  completeDay(dayId: string): Promise<ReadingDayDto> {
    return firstValueFrom(
      this.http.post<ReadingDayDto>(`${this.baseUrl}/api/reading/days/${dayId}/complete`, null),
    );
  }

  async uncompleteDay(dayId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/api/reading/days/${dayId}/complete`),
    );
  }
}
