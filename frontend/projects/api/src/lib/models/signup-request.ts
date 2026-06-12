/** Signup Request — body for `POST /api/auth/register`. */
export interface SignupRequest {
  readonly email: string;
  readonly password: string;
}
