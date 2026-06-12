import { DOCUMENT, Injectable, OnDestroy, inject, signal } from '@angular/core';

import { appNow } from '../shared/clock';
import { isBeforeSunrise } from '../shared/sunrise';
import { timeBand } from '../shared/time-band';

/**
 * The pre-sunrise dawn theme (ADR-003 identity): a `.sh-dawn` class on
 * <body> swaps the `--sh-*` custom properties to the dim warm dark palette.
 *
 * In `auto` (the default) dawn applies when:
 *   - "now" is before the local Toronto sunrise (embedded NOAA approximation), or
 *   - the night band has begun (22:00–4:30 — the app models rest), or
 *   - the OS prefers dark and the evening band has begun (dark-mode devices
 *     get the dawn-equivalent through the dark hours, not just after 22:00).
 *
 * A manual override (auto / light / dawn) persists in `localStorage`
 * (`sh.theme`) and is set from Settings.
 */

export type ThemePreference = 'auto' | 'light' | 'dawn';

const THEME_KEY = 'sh.theme';
const DAWN_CLASS = 'sh-dawn';
const RECHECK_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  private readonly document = inject(DOCUMENT);

  readonly preference = signal<ThemePreference>(readPreference());

  private interval: ReturnType<typeof setInterval> | null = null;
  private media: MediaQueryList | null = null;
  private readonly onChange = (): void => this.apply();

  /** Called once from the app initializer; idempotent. */
  start(): void {
    if (this.interval !== null) return;
    this.interval = setInterval(this.onChange, RECHECK_MS);
    this.document.addEventListener('visibilitychange', this.onChange);
    if (typeof this.document.defaultView?.matchMedia === 'function') {
      this.media = this.document.defaultView.matchMedia('(prefers-color-scheme: dark)');
      this.media.addEventListener('change', this.onChange);
    }
    this.apply();
  }

  ngOnDestroy(): void {
    if (this.interval !== null) clearInterval(this.interval);
    this.document.removeEventListener('visibilitychange', this.onChange);
    this.media?.removeEventListener('change', this.onChange);
    this.interval = null;
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    try {
      localStorage.setItem(THEME_KEY, preference);
    } catch {
      // Storage may be unavailable; the in-memory signal still drives the UI.
    }
    this.apply();
  }

  /** Pure decision — exposed for tests; `apply()` is just this + a class toggle. */
  isDawn(now: Date = appNow()): boolean {
    const preference = this.preference();
    if (preference === 'light') return false;
    if (preference === 'dawn') return true;

    const band = timeBand(now);
    if (band === 'night') return true;
    if (isBeforeSunrise(now)) return true;
    return band === 'evening' && this.prefersDark();
  }

  private prefersDark(): boolean {
    return this.media?.matches ?? false;
  }

  private apply(): void {
    this.document.body.classList.toggle(DAWN_CLASS, this.isDawn());
  }
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dawn' ? stored : 'auto';
  } catch {
    return 'auto';
  }
}
