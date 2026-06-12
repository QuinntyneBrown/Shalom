import { DOCUMENT, Injectable, OnDestroy, inject, signal } from '@angular/core';

/**
 * One signal for "are we online?" (M7 offline UX). Writes are online-only
 * by design — the surfaces that fire mutations disable themselves on this
 * signal, and the app shell shows the thin offline banner.
 *
 * Seeded from `navigator.onLine` and kept current by the window
 * `online`/`offline` events. `navigator.onLine === false` is trustworthy
 * ("definitely offline"); `true` only means "not known to be offline" —
 * good enough for a calm banner, the real mutations still surface errors.
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService implements OnDestroy {
  private readonly window = inject(DOCUMENT).defaultView;

  private readonly state = signal<boolean>(this.window?.navigator?.onLine ?? true);

  /** `true` while the device believes it has a network connection. */
  readonly online = this.state.asReadonly();

  private readonly onOnline = (): void => this.state.set(true);
  private readonly onOffline = (): void => this.state.set(false);

  constructor() {
    this.window?.addEventListener('online', this.onOnline);
    this.window?.addEventListener('offline', this.onOffline);
  }

  ngOnDestroy(): void {
    this.window?.removeEventListener('online', this.onOnline);
    this.window?.removeEventListener('offline', this.onOffline);
  }
}
