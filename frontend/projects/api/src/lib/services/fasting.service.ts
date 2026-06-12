import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { CurrentFastDto } from '../models/current-fast-dto';
import { FastingScheduleDto } from '../models/fasting-schedule-dto';
import { FastingSessionDto } from '../models/fasting-session-dto';
import { StartFastRequest } from '../models/start-fast-request';
import { UpdateFastingScheduleRequest } from '../models/update-fasting-schedule-request';
import { IFastingService } from './fasting.service.contract';

/**
 * Real HTTP `IFastingService`. Bound to `FASTING_SERVICE` in the
 * application composition root.
 */
@Injectable({ providedIn: 'root' })
export class FastingService implements IFastingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getCurrent(): Promise<CurrentFastDto> {
    return firstValueFrom(
      this.http.get<CurrentFastDto>(`${this.baseUrl}/api/fasting/current`),
    );
  }

  start(req: StartFastRequest = {}): Promise<FastingSessionDto> {
    return firstValueFrom(
      this.http.post<FastingSessionDto>(`${this.baseUrl}/api/fasting/start`, req),
    );
  }

  end(): Promise<FastingSessionDto> {
    return firstValueFrom(
      this.http.post<FastingSessionDto>(`${this.baseUrl}/api/fasting/current/end`, {}),
    );
  }

  history(from: string, to: string): Promise<FastingSessionDto[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return firstValueFrom(
      this.http.get<FastingSessionDto[]>(`${this.baseUrl}/api/fasting/history`, { params }),
    );
  }

  updateSchedule(req: UpdateFastingScheduleRequest): Promise<FastingScheduleDto> {
    return firstValueFrom(
      this.http.put<FastingScheduleDto>(`${this.baseUrl}/api/fasting/schedule`, req),
    );
  }
}
