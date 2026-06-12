/**
 * Resend Verification Request — body for `POST /api/auth/resend-verification`.
 */
export interface ResendVerificationRequest {
  readonly email: string;
}
