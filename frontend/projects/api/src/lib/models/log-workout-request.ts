import { EquipmentType } from './equipment-type';

/**
 * Body for `POST /api/workouts`. `startedAt` omitted means "now"
 * (server-side). Effort is carried in `notes` as an `effort:<word>` prefix —
 * the Workout entity deliberately has no dedicated effort field.
 */
export interface LogWorkoutRequest {
  readonly equipment: EquipmentType;
  readonly durationMinutes: number;
  readonly startedAt?: string | null;
  readonly distanceKm?: number | null;
  readonly avgHeartRateBpm?: number | null;
  readonly activeCalories?: number | null;
  readonly notes?: string | null;
}
