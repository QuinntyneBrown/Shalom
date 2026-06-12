/** Response of `GET /api/push/vapid-public-key` (anonymous-safe by design). */
export interface VapidPublicKeyDto {
  publicKey: string;
}
