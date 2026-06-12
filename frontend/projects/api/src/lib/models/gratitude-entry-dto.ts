/** A private gratitude note. `occurredOn` is the server-derived local day (`yyyy-MM-dd`, ADR-004). */
export interface GratitudeEntryDto {
  readonly id: string;
  readonly personId: string | null;
  readonly text: string;
  readonly occurredOn: string;
}
