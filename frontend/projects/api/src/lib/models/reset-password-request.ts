/**
 * Reset Password Request — body for `POST /api/auth/reset-password`.
 */
export interface ResetPasswordRequest {
  readonly token: string;
  readonly password: string;
}
