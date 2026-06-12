/** Body for `POST /api/fasting/start`. Omitted target falls back to the schedule's. */
export interface StartFastRequest {
  readonly targetHours?: number | null;
}
