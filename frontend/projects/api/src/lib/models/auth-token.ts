/**
 * Bearer token returned by the auth endpoints. Persisted under
 * `sh.auth.token` in localStorage (or sessionStorage when remember-me is
 * off — see `SessionStore`).
 */
export interface AuthToken {
  readonly value: string;
  readonly expiresUtc: string;
}
