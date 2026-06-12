import { MealEntryDto } from './meal-entry-dto';
import { WorkoutDto } from './workout-dto';

/** Health pillar of the Today aggregate: today's workouts plus the most recent meal. */
export interface TodayHealthDto {
  readonly todaysWorkouts: WorkoutDto[];
  readonly lastMeal: MealEntryDto | null;
}
