/**
 * Login Request — body for `POST /api/auth/login`.
 */
export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}
