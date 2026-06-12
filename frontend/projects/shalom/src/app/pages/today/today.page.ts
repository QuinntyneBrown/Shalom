import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  CHECK_INS_SERVICE,
  ConnectionNudgeDto,
  PEOPLE_SERVICE,
  READING_SERVICE,
  TODAY_SERVICE,
  TodayDto,
} from 'api';
import { DotScale, ProgressRing, RatingChips, ReadingCard, VerseCard } from 'components';

import { formatElapsed, formatWindowTime } from '../../shared/health-format';
import { daysUntilLabel, smsHref } from '../../shared/people-format';

/**
 * Today pillar — the morning surface.
 *
 * Loads `GET /api/today` once into a signal and renders greeting + date,
 * the verse card, a compact check-in card (mood chips, closeness dots,
 * optional note), the reading card, and a compact fasting card (mini ring
 * with live elapsed + window line; the full Today composition is M6).
 * Saving a check-in upserts today's row server-side (no date leaves the
 * client, ADR-004) and patches the signal; marking the reading done
 * refetches the aggregate so completion, counts, and streaks stay
 * authoritative.
 *
 * The Connection card renders the SERVER-selected daily nudge
 * (`people.nudge`, at most one per day, suppressed once anyone was
 * contacted today — ADR-004) plus the nearest upcoming important date.
 * Done / Not today round-trip and refetch; no nudge state lives here.
 */
@Component({
  selector: 'app-today',
  standalone: true,
  imports: [DatePipe, DotScale, ProgressRing, RatingChips, ReadingCard, RouterLink, VerseCard],
  templateUrl: './today.page.html',
  styleUrl: './today.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayPage implements OnInit, OnDestroy {
  private readonly todayService = inject(TODAY_SERVICE);
  private readonly checkIns = inject(CHECK_INS_SERVICE);
  private readonly reading = inject(READING_SERVICE);
  private readonly people = inject(PEOPLE_SERVICE);

  protected readonly today = signal<TodayDto | null>(null);

  protected readonly mood = signal<number | null>(null);
  protected readonly spiritual = signal<number | null>(null);
  protected readonly note = signal('');
  protected readonly saving = signal(false);
  protected readonly marking = signal(false);

  protected readonly canSave = computed(
    () => this.mood() !== null && this.spiritual() !== null && !this.saving(),
  );

  /** 1s heartbeat for the fasting card's live elapsed. */
  protected readonly now = signal(Date.now());
  private tick: ReturnType<typeof setInterval> | null = null;

  protected readonly fastElapsed = computed(() => {
    const current = this.today()?.fasting.current;
    return current ? formatElapsed(this.now() - Date.parse(current.startedAt)) : null;
  });

  protected readonly fastProgress = computed(() => {
    const current = this.today()?.fasting.current;
    if (!current) return 0;
    const targetMs = current.targetHours * 3_600_000;
    return targetMs > 0 ? (this.now() - Date.parse(current.startedAt)) / targetMs : 0;
  });

  protected readonly fastWindowLine = computed(() => {
    const fasting = this.today()?.fasting;
    if (!fasting) return '';
    return fasting.windowOpen
      ? `Window open until ${formatWindowTime(fasting.todayWindow.end)}`
      : `Window opens at ${formatWindowTime(fasting.todayWindow.start)}`;
  });

  protected readonly fastRatio = computed(() => {
    const fasting = this.today()?.fasting;
    return fasting ? `${fasting.targetHours}:${24 - fasting.targetHours}` : '';
  });

  protected readonly connecting = signal(false);

  /** Nearest upcoming important date, rendered as one quiet line. */
  protected readonly upcomingDateLine = computed(() => {
    const upcoming = this.today()?.people.upcomingDates[0];
    if (!upcoming) return null;
    return `${upcoming.personName} — ${upcoming.label} ${daysUntilLabel(upcoming.daysUntil)}`;
  });

  protected nudgeSmsHref(nudge: ConnectionNudgeDto): string {
    return smsHref(nudge.phone ?? '', nudge.name);
  }

  protected async connectionDone(nudge: ConnectionNudgeDto): Promise<void> {
    if (this.connecting()) return;
    this.connecting.set(true);
    try {
      await this.people.recordContact(nudge.personId);
      await this.load();
    } finally {
      this.connecting.set(false);
    }
  }

  protected async connectionSnooze(nudge: ConnectionNudgeDto): Promise<void> {
    if (this.connecting()) return;
    this.connecting.set(true);
    try {
      await this.people.snooze(nudge.personId);
      await this.load();
    } finally {
      this.connecting.set(false);
    }
  }

  ngOnInit(): void {
    this.tick = setInterval(() => this.now.set(Date.now()), 1_000);
    void this.load();
  }

  ngOnDestroy(): void {
    if (this.tick !== null) clearInterval(this.tick);
  }

  protected async saveCheckIn(): Promise<void> {
    const mood = this.mood();
    const spiritual = this.spiritual();
    if (mood === null || spiritual === null || this.saving()) return;

    this.saving.set(true);
    try {
      const dto = await this.checkIns.upsertToday({
        moodRating: mood,
        spiritualRating: spiritual,
        note: this.note().trim() || null,
      });
      this.today.update((t) => (t ? { ...t, checkIn: dto } : t));
    } finally {
      this.saving.set(false);
    }
  }

  protected async markRead(): Promise<void> {
    const reading = this.today()?.reading;
    if (!reading || reading.completedToday || this.marking()) return;

    this.marking.set(true);
    try {
      await this.reading.completeDay(reading.dayId);
      await this.load();
    } finally {
      this.marking.set(false);
    }
  }

  protected onNoteInput(event: Event): void {
    this.note.set((event.target as HTMLInputElement).value);
  }

  private async load(): Promise<void> {
    const dto = await this.todayService.getToday();
    this.today.set(dto);
    if (dto.checkIn) {
      this.mood.set(dto.checkIn.moodRating);
      this.spiritual.set(dto.checkIn.spiritualRating);
      this.note.set(dto.checkIn.note ?? '');
    }
  }
}
