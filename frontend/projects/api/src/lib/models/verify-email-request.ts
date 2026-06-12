/**
 * Verify Email Request — body for `POST /api/auth/verify-email`.
 */
export interface VerifyEmailRequest {
  readonly token: string;
}
