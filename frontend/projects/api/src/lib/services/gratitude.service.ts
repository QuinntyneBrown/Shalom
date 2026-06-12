import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { AddGratitudeRequest } from '../models/add-gratitude-request';
import { GratitudeEntryDto } from '../models/gratitude-entry-dto';
import { IGratitudeService } from './gratitude.service.contract';

/**
 * Real HTTP `IGratitudeService`. Bound to `GRATITUDE_SERVICE` in the
 * application composition root.
 */
@Injectable({ providedIn: 'root' })
export class GratitudeService implements IGratitudeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  add(req: AddGratitudeRequest): Promise<GratitudeEntryDto> {
    return firstValueFrom(
      this.http.post<GratitudeEntryDto>(`${this.baseUrl}/api/gratitude`, req),
    );
  }

  list(personId?: string, take?: number): Promise<GratitudeEntryDto[]> {
    let params = new HttpParams();
    if (personId) params = params.set('personId', personId);
    if (take !== undefined) params = params.set('take', take);
    return firstValueFrom(
      this.http.get<GratitudeEntryDto[]>(`${this.baseUrl}/api/gratitude`, { params }),
    );
  }
}
