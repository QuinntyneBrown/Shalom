import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { FASTING_SERVICE, FastingOverrideDto, SESSION_STORE } from 'api';

import { EatingWindowDialog, EatingWindowValue } from '../../dialogs/eating-window.dialog';
import { SheetOpener } from '../../dialogs/sheet';
import { WakeTimeDialog } from '../../dialogs/wake-time.dialog';
import {
  formatWakeDisplay,
  isOnboarded,
  markOnboarded,
  readWakeTime,
  writeWakeTime,
} from '../../shared/onboarding';

/** Where each welcome step lives — exported for the spec. */
export type WelcomeStep = 1 | 2 | 3;

/**
 * The welcome flow (designs 16–18) — three calm screens, no auth guard:
 *
 *   1. "Shalom." — the promise, three value rows;
 *   2. "Your rhythm" — wake time (device-local `sh.wakeTime`), eating
 *      window + Sunday exception (server schedule when signed in);
 *   3. "Make it yours" — Add-to-Home-Screen steps (or "You're all set"
 *      when already running standalone), the optional Shortcuts
 *      automation, and the two ways to begin.
 *
 * First run, signed out: the auth guard sends fresh visitors here; the
 * flow ends at sign-in. First sign-in with `sh.onboarded` still unset:
 * sign-in lands here and the flow starts at step 2 as a quick setup —
 * the eating window pre-fills from GET /api/fasting/current and finish
 * applies it via PUT /api/fasting/schedule. Finishing always writes
 * `sh.onboarded=1`; Settings offers a replay.
 */
@Component({
  selector: 'app-welcome',
  standalone: true,
  templateUrl: './welcome.page.html',
  styleUrl: './welcome.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomePage implements OnInit {
  private readonly session = inject(SESSION_STORE);
  private readonly fasting = inject(FASTING_SERVICE);
  private readonly sheets = inject(SheetOpener);
  private readonly router = inject(Router);
  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly step = signal<WelcomeStep>(
    this.session.isAuthenticated() && !isOnboarded() ? 2 : 1,
  );

  protected readonly wakeTime = signal(readWakeTime());
  protected readonly windowStart = signal('12:00');
  protected readonly windowEnd = signal('20:00');
  protected readonly targetHours = signal(16);
  protected readonly sundayException = signal(true);
  protected readonly finishing = signal(false);
  protected readonly shortcutsHelp = signal(false);

  /** True when already running from the Home Screen — step 3 says so. */
  protected readonly standalone = signal(detectStandalone(this.window));

  // Server schedule facts preserved across the PUT (when signed in).
  private sundayStart = '13:30';
  private sundayEnd = '20:30';
  private otherOverrides: FastingOverrideDto[] = [];

  protected readonly steps: readonly WelcomeStep[] = [1, 2, 3];

  protected readonly wakeDisplay = computed(() => formatWakeDisplay(this.wakeTime()));

  protected readonly windowDisplay = computed(
    () => `${formatWakeDisplay(this.windowStart())} – ${formatWakeDisplay(this.windowEnd())}`,
  );

  protected readonly ratio = computed(
    () => `${this.targetHours()}:${24 - this.targetHours()}`,
  );

  ngOnInit(): void {
    if (this.session.isAuthenticated()) void this.prefillSchedule();
  }

  /** Pre-fill the rhythm card from the live schedule (signed-in quick setup). */
  private async prefillSchedule(): Promise<void> {
    try {
      const { schedule } = await this.fasting.getCurrent();
      this.windowStart.set(schedule.eatingWindowStart.slice(0, 5));
      this.windowEnd.set(schedule.eatingWindowEnd.slice(0, 5));
      this.targetHours.set(schedule.targetFastHours);
      const sunday = schedule.overrides.find((o) => o.dayOfWeek === 'Sunday') ?? null;
      this.sundayException.set(sunday !== null);
      if (sunday) {
        this.sundayStart = sunday.eatingWindowStart.slice(0, 5);
        this.sundayEnd = sunday.eatingWindowEnd.slice(0, 5);
      }
      this.otherOverrides = schedule.overrides.filter((o) => o.dayOfWeek !== 'Sunday');
    } catch {
      // The card keeps the calm defaults; Settings can refine later.
    }
  }

  protected continue(): void {
    this.step.update((s) => (s < 3 ? ((s + 1) as WelcomeStep) : s));
  }

  protected changeWakeTime(): void {
    const ref = this.sheets.open<string | undefined>(WakeTimeDialog, this.wakeTime());
    ref.closed.subscribe((time) => {
      if (!time) return;
      this.wakeTime.set(time);
      writeWakeTime(time);
    });
  }

  protected changeWindow(): void {
    const ref = this.sheets.open<EatingWindowValue | undefined>(EatingWindowDialog, {
      start: this.windowStart(),
      end: this.windowEnd(),
    });
    ref.closed.subscribe((value) => {
      if (!value) return;
      this.windowStart.set(value.start);
      this.windowEnd.set(value.end);
      this.targetHours.set(deriveFastHours(value.start, value.end));
    });
  }

  protected toggleSunday(): void {
    this.sundayException.update((on) => !on);
  }

  protected toggleShortcutsHelp(): void {
    this.shortcutsHelp.update((open) => !open);
  }

  /** "Begin tomorrow morning" — finish and rest. */
  protected async finish(): Promise<void> {
    await this.complete('/today');
  }

  /** "or start right now" — finish straight into the ritual. */
  protected async startNow(): Promise<void> {
    await this.complete('/today/ritual');
  }

  private async complete(target: string): Promise<void> {
    if (this.finishing()) return;
    this.finishing.set(true);
    try {
      writeWakeTime(this.wakeTime());
      if (this.session.isAuthenticated()) {
        await this.applySchedule();
        markOnboarded();
        await this.router.navigateByUrl(target);
      } else {
        markOnboarded();
        await this.router.navigateByUrl('/sign-in');
      }
    } finally {
      this.finishing.set(false);
    }
  }

  /** Applies the chosen rhythm wholesale; failure never blocks the welcome. */
  private async applySchedule(): Promise<void> {
    const overrides: FastingOverrideDto[] = [...this.otherOverrides];
    if (this.sundayException()) {
      overrides.push({
        dayOfWeek: 'Sunday',
        eatingWindowStart: `${this.sundayStart}:00`,
        eatingWindowEnd: `${this.sundayEnd}:00`,
      });
    }
    try {
      await this.fasting.updateSchedule({
        windowStart: `${this.windowStart()}:00`,
        windowEnd: `${this.windowEnd()}:00`,
        targetFastHours: this.targetHours(),
        overrides,
      });
    } catch {
      // Grace-forward: the rhythm can be set in Settings; never block here.
    }
  }
}

/** 24h minus the eating window, clamped to the schedule editor's 12–23h range. */
function deriveFastHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const eatingMinutes = eh * 60 + em - (sh * 60 + sm);
  const fastHours = Math.round((24 * 60 - eatingMinutes) / 60);
  return Math.min(23, Math.max(12, fastHours));
}

/** Standalone display-mode = already on the Home Screen (iOS exposes `navigator.standalone`). */
function detectStandalone(win: Window | null): boolean {
  if (!win) return false;
  try {
    if (typeof win.matchMedia === 'function' && win.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
  } catch {
    // matchMedia unavailable (older engines) — fall through to the iOS flag.
  }
  return (win.navigator as Navigator & { standalone?: boolean }).standalone === true;
}
