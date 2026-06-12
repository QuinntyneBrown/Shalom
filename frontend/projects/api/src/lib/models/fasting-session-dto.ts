/**
 * An actual fast (ADR-005). `outcome` is derived server-side at read time —
 * `'Completed'` when elapsed reached the target, `'EndedEarly'` otherwise,
 * `null` while the fast is still open. `elapsedHours` is a server snapshot;
 * live tickers recompute from `startedAt` client-side.
 */
export interface FastingSessionDto {
  readonly id: string;
  /** ISO timestamp (UTC). */
  readonly startedAt: string;
  readonly targetHours: number;
  /** ISO timestamp (UTC), null while the fast is open. */
  readonly endedAt: string | null;
  readonly elapsedHours: number;
  readonly outcome: 'Completed' | 'EndedEarly' | null;
}
