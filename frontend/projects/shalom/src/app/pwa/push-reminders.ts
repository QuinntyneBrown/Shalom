import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';

import { PUSH_SERVICE } from 'api';

/**
 * Where this device stands on reminders. `unsupported` covers every "can't"
 * (no service worker — dev mode or browser tab without install — or no
 * Notification API); `denied` is the OS-level no; `off`/`on` are the
 * owner's choice. The app is fully functional in every one of them.
 */
export type ReminderState = 'unsupported' | 'denied' | 'off' | 'on';

/**
 * The M10 push-reminder seam: subscription lifecycle (SwPush + the
 * `/api/push` endpoints) and notification-click deep links, in one place.
 *
 * iOS reality (16.4+): `PushManager.subscribe` must run inside a user
 * gesture's transient activation, and an `await` on a network call can
 * outlive it. The VAPID key is therefore PREFETCHED the moment the service
 * exists, so `enable()` — always called from a tap (settings sheet or
 * discovery card) — reaches `requestSubscription` without a network hop.
 */
@Injectable({ providedIn: 'root' })
export class PushReminders {
  private readonly swPush = inject(SwPush, { optional: true });
  private readonly pushApi = inject(PUSH_SERVICE);
  private readonly router = inject(Router);

  private vapidKey: string | null = null;

  private readonly subscription = signal<PushSubscription | null>(null);
  private readonly permission = signal<NotificationPermission | 'unsupported'>(readPermission());

  /** Single source of truth for the settings row and the sheet. */
  readonly state = computed<ReminderState>(() => {
    if (!this.swPush?.isEnabled || this.permission() === 'unsupported') return 'unsupported';
    if (this.permission() === 'denied') return 'denied';
    return this.subscription() ? 'on' : 'off';
  });

  constructor() {
    if (this.swPush?.isEnabled) {
      this.swPush.subscription.subscribe((sub) => this.subscription.set(sub));
      // Prefetch (anonymous-safe endpoint) — see the class note on iOS.
      void this.pushApi
        .vapidPublicKey()
        .then((key) => (this.vapidKey = key))
        .catch(() => undefined);
    }
  }

  /**
   * Wired as an app initializer: clicking a reminder while the app is open
   * (or freshly opened by the worker) follows its deep link in-app.
   */
  start(): void {
    this.swPush?.notificationClicks.subscribe((event) => {
      const url = (event.notification.data as { url?: string } | undefined)?.url;
      if (url) void this.router.navigateByUrl(url);
    });
  }

  /**
   * The discovery card's whole eligibility, judged from the environment:
   * installed standalone PWA, push actually possible, and the permission
   * question never asked before (`default`). CLAUDE.md: ask IN CONTEXT,
   * never at launch.
   */
  optInAvailable(): boolean {
    return this.state() === 'off' && this.permission() === 'default' && isStandaloneDisplay();
  }

  /**
   * Subscribe this device. MUST be called from a user gesture (iOS).
   * Returns the resulting state; `denied` and failures stay calm — no
   * throw reaches the tap handler.
   */
  async enable(): Promise<ReminderState> {
    if (!this.swPush?.isEnabled || this.permission() === 'unsupported') return 'unsupported';
    try {
      const key = this.vapidKey ?? (await this.pushApi.vapidPublicKey());
      this.vapidKey = key;
      const sub = await this.swPush.requestSubscription({ serverPublicKey: key });
      const keys = sub.toJSON().keys ?? {};
      await this.pushApi.subscribe({
        endpoint: sub.endpoint,
        p256dh: keys['p256dh'] ?? '',
        auth: keys['auth'] ?? '',
      });
      this.subscription.set(sub);
      this.refreshPermission();
      return 'on';
    } catch {
      this.refreshPermission();
      return this.state() === 'denied' ? 'denied' : 'off';
    }
  }

  /** Unsubscribe this device — both the browser side and the server row. */
  async disable(): Promise<void> {
    const endpoint = this.subscription()?.endpoint ?? null;
    try {
      await this.swPush?.unsubscribe();
    } catch {
      // Already gone browser-side; the server row still goes below.
    }
    if (endpoint) {
      try {
        await this.pushApi.unsubscribe(endpoint);
      } catch {
        // Dead row server-side prunes itself on the next failed send.
      }
    }
    this.subscription.set(null);
    this.refreshPermission();
  }

  private refreshPermission(): void {
    this.permission.set(readPermission());
  }
}

function readPermission(): NotificationPermission | 'unsupported' {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

/** Installed-PWA check: iOS exposes `navigator.standalone`, the rest the media query. */
function isStandaloneDisplay(): boolean {
  return (
    (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
