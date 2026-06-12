import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';

import {
  CHECK_INS_SERVICE,
  READING_SERVICE,
  TODAY_SERVICE,
  TodayDto,
} from 'api';
import { DotScale, RatingChips, ReadingCard, VerseCard } from 'components';

/**
 * Today pillar — the morning surface.
 *
 * Loads `GET /api/today` once into a signal and renders greeting + date,
 * the verse card, a compact check-in card (mood chips, closeness dots,
 * optional note), and the reading card. Saving a check-in upserts today's
 * row server-side (no date leaves the client, ADR-004) and patches the
 * signal; marking the reading done refetches the aggregate so completion,
 * counts, and streaks stay authoritative.
 */
@Component({
  selector: 'app-today',
  standalone: true,
  imports: [DatePipe, DotScale, RatingChips, ReadingCard, VerseCard],
  templateUrl: './today.page.html',
  styleUrl: './today.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayPage implements OnInit {
  private readonly todayService = inject(TODAY_SERVICE);
  private readonly checkIns = inject(CHECK_INS_SERVICE);
  private readonly reading = inject(READING_SERVICE);

  protected readonly today = signal<TodayDto | null>(null);

  protected readonly mood = signal<number | null>(null);
  protected readonly spiritual = signal<number | null>(null);
  protected readonly note = signal('');
  protected readonly saving = signal(false);
  protected readonly marking = signal(false);

  protected readonly canSave = computed(
    () => this.mood() !== null && this.spiritual() !== null && !this.saving(),
  );

  ngOnInit(): void {
    void this.load();
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
