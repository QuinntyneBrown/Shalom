import { EquipmentType } from './equipment-type';

/** A logged workout. `startedAt` is an ISO UTC timestamp. */
export interface WorkoutDto {
  readonly id: string;
  readonly equipment: EquipmentType;
  readonly startedAt: string;
  readonly durationMinutes: number;
  readonly distanceKm: number | null;
  readonly avgHeartRateBpm: number | null;
  readonly activeCalories: number | null;
  readonly notes: string | null;
}
