/**
 * A daily check-in. `date` is the server-derived America/Toronto local day
 * (`yyyy-MM-dd`, ADR-004) — clients never send it for today-operations.
 */
export interface CheckInDto {
  readonly id: string;
  readonly date: string;
  readonly moodRating: number;
  readonly spiritualRating: number;
  readonly note: string | null;
}
