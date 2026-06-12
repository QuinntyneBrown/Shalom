import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { ConnectionNudgeDto, MealEntryDto, WorkoutDto } from 'api';
import { DiscoveryCard, MOOD_LABELS, ProgressRing } from 'components';

import { MealLogDialog } from '../../dialogs/meal-log.dialog';
import { SheetOpener } from '../../dialogs/sheet';
import { WorkoutLogDialog, WorkoutLogData } from '../../dialogs/workout-log.dialog';
import { appNow } from '../../shared/clock';
import {
  INTENTION_OPTIONS,
  Intention,
  dismissMovement,
  intentionLabel,
  isMovementDismissed,
  readIntention,
  writeIntention,
} from '../../shared/day-prefs';
import { DiscoveryCardModel, DiscoveryStorage, evaluateDiscovery } from '../../shared/discovery';
import { formatElapsed, formatWindowTime, toIsoDate } from '../../shared/health-format';
import { daysUntilLabel, smsHref, telHref } from '../../shared/people-format';
import { countdownLabel, minutesUntil, timeBand } from '../../shared/time-band';
import { TodayStore } from '../../state/today.store';

/**
 * Today — the time-aware home surface (designs 01–04). One `TodayStore`
 * aggregate, four compositions:
 *
 *   - morning: ritual hero (or compact morning-complete), fasting,
 *     movement intention, connection, discovery;
 *   - midday: morning state, eating-window card, connection, movement,
 *     discovery;
 *   - evening: window-closing countdown (gold under an hour), movement
 *     nudge with an equal-calm "Not tonight", morning state, tomorrow
 *     glance;
 *   - night (22:00–4:30): rest — a verse fragment and nothing to do.
 *
 * Time comes from `appNow()` (e2e-pinnable); the band edges prefer the
 * day's real eating window. Movement intention and the evening dismissal
 * are device-local per-day facts (`sh.intention.*` / `sh.movement.*`); the
 * Discovery engine is pure with `sh.discovery.*` state.
 */
@Component({
  selector: 'app-today',
  standalone: true,
  imports: [DatePipe, DiscoveryCard, NgTemplateOutlet, ProgressRing, RouterLink],
  templateUrl: './today.page.html',
  styleUrl: './today.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayPage implements OnInit, OnDestroy {
  protected readonly store = inject(TodayStore);
  private readonly sheets = inject(SheetOpener);
  private readonly router = inject(Router);

  /** 1s heartbeat: live fasting elapsed, countdowns, band edges. */
  protected readonly now = signal(appNow().getTime());
  private tick: ReturnType<typeof setInterval> | null = null;

  protected readonly band = computed(() =>
    timeBand(new Date(this.now()), this.store.fasting()?.todayWindow ?? null),
  );

  protected readonly greetingWord = computed(() => {
    switch (this.band()) {
      case 'midday':
        return 'Good afternoon';
      case 'evening':
        return 'Good evening';
      default:
        return 'Good morning';
    }
  });

  protected readonly avatarInitial = computed(
    () => (this.store.greetingName()[0] ?? 'S').toUpperCase(),
  );

  // ---- fasting -----------------------------------------------------------

  protected readonly fastElapsed = computed(() => {
    const current = this.store.fasting()?.current;
    return current ? formatElapsed(this.now() - Date.parse(current.startedAt)) : null;
  });

  protected readonly fastProgress = computed(() => {
    const current = this.store.fasting()?.current;
    if (!current) return 0;
    const targetMs = current.targetHours * 3_600_000;
    return targetMs > 0 ? (this.now() - Date.parse(current.startedAt)) / targetMs : 0;
  });

  protected readonly fastRatio = computed(() => {
    const fasting = this.store.fasting();
    return fasting ? `${fasting.targetHours}:${24 - fasting.targetHours}` : '';
  });

  protected readonly fastWindowLine = computed(() => {
    const fasting = this.store.fasting();
    if (!fasting) return '';
    if (fasting.windowOpen) {
      return `Window open until ${formatWindowTime(fasting.todayWindow.end)}`;
    }
    const opens = `Window opens at ${formatWindowTime(fasting.todayWindow.start)}`;
    return fasting.current ? `${opens} — going strong` : opens;
  });

  /** The one-line state under the greeting (design: "Fasting · 11h 24m · opens 11:00"). */
  protected readonly statusPill = computed(() => {
    const fasting = this.store.fasting();
    if (!fasting) return '';
    const end = formatWindowTime(fasting.todayWindow.end);
    const start = formatWindowTime(fasting.todayWindow.start);
    if (fasting.windowOpen) {
      return this.band() === 'evening' ? `Window closes ${end}` : `Window open · closes ${end}`;
    }
    const beforeOpen = (minutesUntil(new Date(this.now()), fasting.todayWindow.start) ?? 0) > 0;
    const elapsed = this.fastElapsed();
    if (elapsed) return beforeOpen ? `Fasting · ${elapsed} · opens ${start}` : `Fasting · ${elapsed}`;
    return beforeOpen ? `Window opens ${start}` : `Window closed ${end}`;
  });

  /** Minutes until the open window closes; null when it isn't open. */
  protected readonly windowCloseMinutes = computed(() => {
    const fasting = this.store.fasting();
    if (!fasting?.windowOpen) return null;
    return minutesUntil(new Date(this.now()), fasting.todayWindow.end);
  });

  protected readonly windowCountdown = computed(() => {
    const minutes = this.windowCloseMinutes();
    return minutes === null ? '' : countdownLabel(minutes);
  });

  protected readonly closingSoon = computed(() => (this.windowCloseMinutes() ?? 999) < 60);

  // ---- morning state -------------------------------------------------------

  protected readonly moodWord = computed(() => {
    const rating = this.store.checkIn()?.moodRating;
    return rating ? (MOOD_LABELS[rating] ?? null) : null;
  });

  protected readonly morningCompleteLine = computed(() => {
    const reference = this.store.verse()?.reference ?? '';
    const mood = this.moodWord();
    return mood ? `${reference} · felt ${mood}` : reference;
  });

  protected readonly dayNumber = computed(() => this.store.streaks()?.checkInCurrent ?? 0);

  // ---- movement -------------------------------------------------------------

  protected readonly intentionOptions = INTENTION_OPTIONS;
  private readonly dayPrefsVersion = signal(0);

  protected readonly intention = computed<Intention | null>(() => {
    this.dayPrefsVersion();
    this.now(); // re-read across midnight
    return readIntention(toIsoDate(appNow()));
  });

  protected readonly movementDismissed = computed(() => {
    this.dayPrefsVersion();
    return isMovementDismissed(toIsoDate(appNow()));
  });

  protected readonly todaysWorkout = computed<WorkoutDto | null>(
    () => this.store.health()?.todaysWorkouts[0] ?? null,
  );

  protected readonly middayMovementLine = computed(() => {
    const workout = this.todaysWorkout();
    if (workout) return `Done today — ${workout.durationMinutes} minutes. Nicely moved.`;
    const intention = this.intention();
    if (intention === 'Rest') return 'Rest today — that counts too.';
    if (intention) {
      const noun = intention === 'IndoorBike' ? 'ride' : 'session';
      return `A 20-minute ${noun} is still on the table — no pressure.`;
    }
    return 'Twenty easy minutes, whenever it fits.';
  });

  protected readonly eveningMovementLine = computed(() => {
    const intention = this.intention();
    const label =
      intention && intention !== 'Rest' ? intentionLabel(intention).toLowerCase() : 'bike';
    return `Still time for 20 minutes on the ${label}?`;
  });

  protected readonly eveningLogLabel = computed(() =>
    this.intention() === 'IndoorBike' || !this.intention() ? 'Log a ride' : 'Log it',
  );

  /** Evening movement nudge: hidden once logged, dismissed, or on a rest day. */
  protected readonly showEveningMovement = computed(
    () => !this.todaysWorkout() && !this.movementDismissed() && this.intention() !== 'Rest',
  );

  // ---- connection -----------------------------------------------------------

  protected readonly connecting = signal(false);

  protected readonly upcomingDateLine = computed(() => {
    const upcoming = this.store.upcomingDates()[0];
    if (!upcoming) return null;
    return `${upcoming.personName} — ${upcoming.label} ${daysUntilLabel(upcoming.daysUntil)}`;
  });

  // ---- tomorrow glance ---------------------------------------------------------

  protected readonly tomorrowLine = computed(() => {
    const next = this.store.reading()?.nextPassageReference;
    const prayer = this.store.prayerFocus()?.tomorrowName;
    const parts = [
      `Reading: ${next ?? 'a quiet day'}`,
      ...(prayer ? [`Prayer: ${prayer}`] : []),
    ];
    return parts.join(' · ');
  });

  // ---- discovery -------------------------------------------------------------

  private readonly discoveryStorage = new DiscoveryStorage();
  private readonly discoveryVersion = signal(0);

  protected readonly discovery = computed<DiscoveryCardModel | null>(() => {
    const today = this.store.today();
    if (!today) return null;
    this.discoveryVersion();
    const todayIso = toIsoDate(appNow());
    return evaluateDiscovery(today, this.discoveryStorage.read(todayIso), todayIso);
  });

  /** Record the day a card is actually rendered (drives "never two days in a row"). */
  private readonly recordShown = effect(() => {
    const card = this.discovery();
    if (card && this.band() !== 'night' && this.band() !== 'evening') {
      this.discoveryStorage.markShown(card.id, toIsoDate(appNow()));
    }
  });

  ngOnInit(): void {
    this.tick = setInterval(() => this.now.set(appNow().getTime()), 1_000);
    void this.store.ensureLoaded();
  }

  ngOnDestroy(): void {
    if (this.tick !== null) clearInterval(this.tick);
  }

  // ---- actions ----------------------------------------------------------------

  protected chooseIntention(intention: Intention): void {
    writeIntention(toIsoDate(appNow()), intention);
    this.dayPrefsVersion.update((v) => v + 1);
  }

  protected notTonight(): void {
    dismissMovement(toIsoDate(appNow()));
    this.dayPrefsVersion.update((v) => v + 1);
  }

  protected openMealLog(): void {
    // "Break your fast well" — logging the first meal also closes an open fast.
    if (this.store.fasting()?.current) {
      void this.store.endFast().catch(() => undefined);
    }
    const ref = this.sheets.open<MealEntryDto | undefined>(MealLogDialog);
    ref.closed.subscribe(() => void this.store.load().catch(() => undefined));
  }

  protected openWorkoutLog(): void {
    const intention = this.intention();
    const data: WorkoutLogData = {
      equipment: intention && intention !== 'Rest' ? intention : null,
    };
    const ref = this.sheets.open<WorkoutDto | undefined>(WorkoutLogDialog, data);
    ref.closed.subscribe(() => void this.store.load().catch(() => undefined));
  }

  protected nudgeSmsHref(nudge: ConnectionNudgeDto): string {
    return smsHref(nudge.phone ?? '', nudge.name);
  }

  protected nudgeTelHref(nudge: ConnectionNudgeDto): string {
    return telHref(nudge.phone ?? '');
  }

  protected async connectionDone(nudge: ConnectionNudgeDto): Promise<void> {
    if (this.connecting()) return;
    this.connecting.set(true);
    try {
      await this.store.recordContact(nudge.personId);
    } finally {
      this.connecting.set(false);
    }
  }

  protected async connectionSnooze(nudge: ConnectionNudgeDto): Promise<void> {
    if (this.connecting()) return;
    this.connecting.set(true);
    try {
      await this.store.snoozeNudge(nudge.personId);
    } finally {
      this.connecting.set(false);
    }
  }

  protected dismissDiscovery(card: DiscoveryCardModel): void {
    this.discoveryStorage.snooze(card.id, toIsoDate(appNow()));
    this.discoveryVersion.update((v) => v + 1);
  }

  protected followDiscovery(card: DiscoveryCardModel): void {
    this.discoveryStorage.markDone(card.id);
    this.discoveryVersion.update((v) => v + 1);
    if (card.ctaRoute) void this.router.navigateByUrl(card.ctaRoute);
  }
}
