/** Body for `POST /api/people/{id}/dates`. `leadDays` defaults server-side to 7. */
export interface AddImportantDateRequest {
  readonly label: string;
  readonly month: number;
  readonly day: number;
  readonly year?: number | null;
  readonly leadDays?: number | null;
}
