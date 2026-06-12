/**
 * Forgot Password Request — body for `POST /api/auth/forgot-password`.
 */
export interface ForgotPasswordRequest {
  readonly email: string;
}
