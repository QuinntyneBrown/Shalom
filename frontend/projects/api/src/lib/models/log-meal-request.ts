import { MealTag } from './meal-tag';

/** Body for `POST /api/meals`. The server stamps "now" — no time leaves the client. */
export interface LogMealRequest {
  readonly text: string;
  readonly tags: MealTag[];
}
