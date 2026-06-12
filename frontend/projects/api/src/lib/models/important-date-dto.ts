/**
 * A recurring date with its server-derived next occurrence (`yyyy-MM-dd`)
 * and `daysUntil` from the server's local today (ADR-004). Feb 29 lands on
 * Feb 28 in non-leap years.
 */
export interface ImportantDateDto {
  readonly id: string;
  readonly personId: string;
  readonly label: string;
  readonly month: number;
  readonly day: number;
  readonly year: number | null;
  readonly leadDays: number;
  readonly nextOccurrence: string;
  readonly daysUntil: number;
}
