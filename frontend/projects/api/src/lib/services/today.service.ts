import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { TodayDto } from '../models/today-dto';
import { ITodayService } from './today.service.contract';

/**
 * Real HTTP `ITodayService`. Bound to `TODAY_SERVICE` in the application
 * composition root.
 */
@Injectable({ providedIn: 'root' })
export class TodayService implements ITodayService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getToday(): Promise<TodayDto> {
    return firstValueFrom(this.http.get<TodayDto>(`${this.baseUrl}/api/today`));
  }
}
