import { InjectionToken } from '@angular/core';

import { LogWorkoutRequest } from '../models/log-workout-request';
import { WorkoutDto } from '../models/workout-dto';

/** HTTP boundary for `/api/workouts`. */
export interface IWorkoutsService {
  log(req: LogWorkoutRequest): Promise<WorkoutDto>;
  /** Workouts with `from <= localDay(startedAt) <= to` (both `yyyy-MM-dd`), newest first. */
  list(from: string, to: string): Promise<WorkoutDto[]>;
  /** 404s (rejected promise) when the id is missing or someone else's. */
  delete(id: string): Promise<void>;
}

export const WORKOUTS_SERVICE = new InjectionToken<IWorkoutsService>('WORKOUTS_SERVICE');
