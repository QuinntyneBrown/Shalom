/** Body for `POST /api/people` and `PUT /api/people/{id}`. */
export interface SavePersonRequest {
  readonly name: string;
  readonly relationship?: string | null;
  readonly phone?: string | null;
  readonly contactCadenceDays?: number | null;
  readonly notes?: string | null;
}
