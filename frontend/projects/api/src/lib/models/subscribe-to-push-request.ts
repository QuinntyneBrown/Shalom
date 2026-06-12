/**
 * Body for `POST /api/push/subscribe` — the browser's
 * `PushSubscription.toJSON()` flattened to what the server stores
 * (`keys.p256dh` / `keys.auth` hoisted up).
 */
export interface SubscribeToPushRequest {
  endpoint: string;
  p256dh: string;
  auth: string;
}
