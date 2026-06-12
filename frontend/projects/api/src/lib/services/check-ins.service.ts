import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { CheckInDto } from '../models/check-in-dto';
import { UpsertCheckInRequest } from '../models/upsert-check-in-request';
import { ICheckInsService } from './check-ins.service.contract';

/**
 * Real HTTP `ICheckInsService`. Bound to `CHECK_INS_SERVICE` in the
 * application composition root.
 */
@Injectable({ providedIn: 'root' })
export class CheckInsService implements ICheckInsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  upsertToday(req: UpsertCheckInRequest): Promise<CheckInDto> {
    return firstValueFrom(
      this.http.put<CheckInDto>(`${this.baseUrl}/api/check-ins/today`, req),
    );
  }

  list(from: string, to: string): Promise<CheckInDto[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return firstValueFrom(
      this.http.get<CheckInDto[]>(`${this.baseUrl}/api/check-ins`, { params }),
    );
  }
}
