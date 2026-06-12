/**
 * A person in the circle. `lastContactedOn` / `snoozedUntil` are
 * server-derived local days (`yyyy-MM-dd`, ADR-004) — whether a nudge is
 * due is always computed server-side, never stored or client-derived.
 */
export interface PersonDto {
  readonly id: string;
  readonly name: string;
  readonly relationship: string | null;
  readonly phone: string | null;
  readonly contactCadenceDays: number | null;
  readonly notes: string | null;
  readonly lastContactedOn: string | null;
  readonly snoozedUntil: string | null;
}
