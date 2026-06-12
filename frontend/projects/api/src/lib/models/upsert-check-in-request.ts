/**
 * Body for `PUT /api/check-ins/today`. No date — "today" is derived
 * server-side (ADR-004).
 */
export interface UpsertCheckInRequest {
  readonly moodRating: number;
  readonly spiritualRating: number;
  readonly note?: string | null;
}
