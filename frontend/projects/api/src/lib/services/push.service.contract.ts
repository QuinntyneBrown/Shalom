import { InjectionToken } from '@angular/core';

import { SubscribeToPushRequest } from '../models/subscribe-to-push-request';

/**
 * HTTP boundary for `/api/push/*` (M10 web-push reminders). Subscriptions
 * are upserted by endpoint server-side; unsubscribe is idempotent. The
 * VAPID public key is fetched here because the client needs it BEFORE
 * `PushManager.subscribe` can run.
 */
export interface IPushService {
  /** Registers (or refreshes) this device's push subscription. */
  subscribe(req: SubscribeToPushRequest): Promise<void>;
  /** Removes the subscription for this endpoint. Safe to repeat. */
  unsubscribe(endpoint: string): Promise<void>;
  /** The VAPID application server key for `PushManager.subscribe`. */
  vapidPublicKey(): Promise<string>;
}

export const PUSH_SERVICE = new InjectionToken<IPushService>('PUSH_SERVICE');
