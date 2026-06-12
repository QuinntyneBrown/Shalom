import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { DotScale, MOOD_LABELS, RatingChips } from 'components';

import { appNow } from '../../shared/clock';
import {
  INTENTION_OPTIONS,
  Intention,
  intentionLabel,
  readIntention,
  writeIntention,
} from '../../shared/day-prefs';
import { formatWindowTime, toIsoDate } from '../../shared/health-format';
import { TodayStore } from '../../state/today.store';

/** The four ritual steps plus the completion moment. */
export type RitualStep = 1 | 2 | 3 | 4 | 'complete';

/**
 * The morning ritual (designs 05–09) — full-screen, nav-less, about two
 * minutes: (1) check-in, (2) scripture, (3) prayer focus, (4) day preview,
 * then the "Shalom." completion moment.
 *
 * Every step saves through `TodayStore`'s optimistic mutations and advances
 * IMMEDIATELY — the server settles in the background, and closing early (X)
 * keeps whatever was already saved. Grace-forward: steps are skippable, the
 * ritual never blocks on the network, and nothing scolds.
 */
@Component({
  selector: 'app-ritual',
  standalone: true,
  imports: [DotScale, RatingChips],
  templateUrl: './ritual.page.html',
  styleUrl: './ritual.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RitualPage implements OnInit {
  protected readonly store = inject(TodayStore);
  private readonly router = inject(Router);

  protected readonly step = signal<RitualStep>(1);

  // Step 1 — check-in (prefilled when today's already exists).
  protected readonly mood = signal<number | null>(null);
  protected readonly spiritual = signal<number | null>(null);
  protected readonly note = signal('');
  protected readonly canContinue = computed(
    () => this.mood() !== null && this.spiritual() !== null,
  );

  // Step 4 — movement intention (device-local, keyed by local date).
  protected readonly intentionOptions = INTENTION_OPTIONS;
  protected readonly intention = signal<Intention | null>(readIntention(toIsoDate(appNow())));
  protected readonly choosingIntention = signal(false);

  protected readonly verse = this.store.verse;
  protected readonly reading = this.store.reading;
  protected readonly focus = this.store.prayerFocus;
  protected readonly nudge = this.store.nudge;
  protected readonly fasting = this.store.fasting;
  protected readonly streaksVisible = this.store.streaksVisible;

  protected readonly dayNumber = computed(() => this.store.streaks()?.checkInCurrent ?? 0);

  protected readonly windowLine = computed(() => {
    const fasting = this.fasting();
    if (!fasting) return '';
    return `Opens ${formatWindowTime(fasting.todayWindow.start)} · closes ${formatWindowTime(fasting.todayWindow.end)}`;
  });

  protected readonly intentionSummary = computed(() => {
    const intention = this.intention();
    if (!intention) return null;
    return intention === 'Rest'
      ? 'Rest — that counts too'
      : `${intentionLabel(intention)} — 20 minutes, when it fits`;
  });

  protected readonly scriptureCta = computed(() =>
    this.reading() && !this.reading()!.completedToday ? 'Mark read · Continue' : 'Continue',
  );

  /** Prefill once the aggregate lands (it may already be in the store). */
  private readonly prefill = effect(() => {
    const checkIn = this.store.checkIn();
    if (checkIn && this.mood() === null && this.spiritual() === null) {
      this.mood.set(checkIn.moodRating);
      this.spiritual.set(checkIn.spiritualRating);
      this.note.set(checkIn.note ?? '');
    }
  });

  ngOnInit(): void {
    void this.store.ensureLoaded();
  }

  protected moodWord(rating: number): string {
    return MOOD_LABELS[rating] ?? '';
  }

  protected onNoteInput(event: Event): void {
    this.note.set((event.target as HTMLInputElement).value);
  }

  /** Step 1 → 2: optimistic save, immediate advance (never blocks on the network). */
  protected continueCheckIn(): void {
    const mood = this.mood();
    const spiritual = this.spiritual();
    if (mood === null || spiritual === null) return;

    void this.store
      .saveCheckIn({ moodRating: mood, spiritualRating: spiritual, note: this.note().trim() || null })
      .catch(() => undefined); // rollback already happened in the store; the morning goes on
    this.step.set(2);
  }

  /** Step 2 → 3: marks today's reading read when there is one to mark. */
  protected markReadContinue(): void {
    const reading = this.reading();
    if (reading && !reading.completedToday) {
      void this.store.completeReading().catch(() => undefined);
    }
    this.step.set(3);
  }

  protected amen(): void {
    this.step.set(4);
  }

  protected done(): void {
    this.step.set('complete');
  }

  protected chooseIntention(intention: Intention): void {
    this.intention.set(intention);
    this.choosingIntention.set(false);
    writeIntention(toIsoDate(appNow()), intention);
  }

  protected changeIntention(): void {
    this.choosingIntention.set(true);
  }

  /** X (any step) and the completion tap both land back on Today. */
  protected close(): void {
    void this.router.navigateByUrl('/today');
  }

  protected dotState(dot: number): 'done' | 'todo' {
    const step = this.step();
    const current = step === 'complete' ? 4 : step;
    return dot <= current ? 'done' : 'todo';
  }
}
