import { MealTag } from './meal-tag';

/** A logged meal. `occurredAt` is an ISO UTC timestamp. */
export interface MealEntryDto {
  readonly id: string;
  readonly text: string;
  readonly tags: MealTag[];
  readonly occurredAt: string;
}
