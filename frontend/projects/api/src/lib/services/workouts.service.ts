import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { LogWorkoutRequest } from '../models/log-workout-request';
import { WorkoutDto } from '../models/workout-dto';
import { IWorkoutsService } from './workouts.service.contract';

/**
 * Real HTTP `IWorkoutsService`. Bound to `WORKOUTS_SERVICE` in the
 * application composition root.
 */
@Injectable({ providedIn: 'root' })
export class WorkoutsService implements IWorkoutsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  log(req: LogWorkoutRequest): Promise<WorkoutDto> {
    return firstValueFrom(
      this.http.post<WorkoutDto>(`${this.baseUrl}/api/workouts`, req),
    );
  }

  list(from: string, to: string): Promise<WorkoutDto[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return firstValueFrom(
      this.http.get<WorkoutDto[]>(`${this.baseUrl}/api/workouts`, { params }),
    );
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/api/workouts/${id}`));
  }
}
