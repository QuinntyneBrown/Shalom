import { DOCUMENT, Injectable, OnDestroy, computed, inject, signal } from '@angular/core';

import {
  CHECK_INS_SERVICE,
  CheckInDto,
  FASTING_SERVICE,
  PEOPLE_SERVICE,
  READING_SERVICE,
  TODAY_SERVICE,
  TodayDto,
  UpsertCheckInRequest,
} from 'api';

import { appNow } from '../shared/clock';
import { toIsoDate } from '../shared/health-format';

/**
 * Signal store for the `GET /api/today` aggregate — the single source every
 * Today/ritual surface reads from (CLAUDE.md).
 *
 * - `load()` fetches the aggregate; per-card `computed()` views below.
 * - Mutations apply an OPTIMISTIC patch first, then hit the API; success
 *   triggers a quiet background refetch (server stays authoritative for
 *   streaks/derived facts), failure rolls the patch back and rethrows.
 * - iOS resumes PWAs days later: on `visibilitychange` the store refetches
 *   whenever the cached DTO's local date no longer equals the device's
 *   local date — an in-memory "today" is never trusted (ADR-004).
 */
@Injectable({ providedIn: 'root' })
export class TodayStore implements OnDestroy {
  private readonly todayApi = inject(TODAY_SERVICE);
  private readonly checkInsApi = inject(CHECK_INS_SERVICE);
  private readonly readingApi = inject(READING_SERVICE);
  private readonly fastingApi = inject(FASTING_SERVICE);
  private readonly peopleApi = inject(PEOPLE_SERVICE);
  private readonly document = inject(DOCUMENT);

  private readonly state = signal<TodayDto | null>(null);

  readonly today = this.state.asReadonly();
  readonly loaded = computed(() => this.state() !== null);

  // One computed view per card, so OnPush surfaces re-render independently.
  readonly checkIn = computed(() => this.state()?.checkIn ?? null);
  readonly verse = computed(() => this.state()?.verse ?? null);
  readonly reading = computed(() => this.state()?.reading ?? null);
  readonly streaks = computed(() => this.state()?.streaks ?? null);
  readonly fasting = computed(() => this.state()?.fasting ?? null);
  readonly health = computed(() => this.state()?.health ?? null);
  readonly nudge = computed(() => this.state()?.people.nudge ?? null);
  readonly upcomingDates = computed(() => this.state()?.people.upcomingDates ?? []);
  readonly prayerFocus = computed(() => this.state()?.people.prayerFocus ?? null);
  readonly ritualCompletedToday = computed(() => this.state()?.ritualCompletedToday ?? false);
  readonly greetingName = computed(() => this.state()?.greetingName ?? '');

  /**
   * Discovery rule: streak badges stay hidden app-wide (hero included)
   * until the third completed morning. Server numbers already carry the
   * Sabbath grace.
   */
  readonly streaksVisible = computed(() => (this.state()?.streaks.checkInCurrent ?? 0) >= 3);

  private readonly visibilityHandler = (): void => this.onVisibilityChange();

  constructor() {
    this.document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  ngOnDestroy(): void {
    this.document.removeEventListener('visibilitychange', this.visibilityHandler);
  }

  async load(): Promise<void> {
    this.state.set(await this.todayApi.getToday());
  }

  async ensureLoaded(): Promise<void> {
    if (!this.state()) await this.load();
  }

  /** Optimistic upsert of today's check-in (the ritual's step 1). */
  async saveCheckIn(req: UpsertCheckInRequest): Promise<void> {
    const snapshot = this.state();
    const optimistic: CheckInDto = {
      id: snapshot?.checkIn?.id ?? 'pending',
      date: snapshot?.date ?? toIsoDate(appNow()),
      moodRating: req.moodRating,
      spiritualRating: req.spiritualRating,
      note: req.note ?? null,
    };
    this.patch((t) => ({ ...t, checkIn: optimistic }));

    try {
      const saved = await this.checkInsApi.upsertToday(req);
      this.patch((t) => ({ ...t, checkIn: saved }));
      this.refetchQuietly();
    } catch (error) {
      this.state.set(snapshot);
      throw error;
    }
  }

  /** Optimistically marks today's reading day read (ritual step 2). */
  async completeReading(): Promise<void> {
    const snapshot = this.state();
    const reading = snapshot?.reading;
    if (!reading || reading.completedToday) return;

    this.patch((t) => ({
      ...t,
      reading: t.reading
        ? { ...t.reading, completedToday: true, completedCount: t.reading.completedCount + 1 }
        : t.reading,
    }));

    try {
      await this.readingApi.completeDay(reading.dayId);
      this.refetchQuietly();
    } catch (error) {
      this.state.set(snapshot ?? null);
      throw error;
    }
  }

  /** Optimistically ends the open fast ("Break your fast well"). */
  async endFast(): Promise<void> {
    const snapshot = this.state();
    if (!snapshot?.fasting.current) return;

    this.patch((t) => ({ ...t, fasting: { ...t.fasting, current: null } }));

    try {
      await this.fastingApi.end();
      this.refetchQuietly();
    } catch (error) {
      this.state.set(snapshot);
      throw error;
    }
  }

  /** Optimistically records a contact — today's nudge disappears at once. */
  async recordContact(personId: string): Promise<void> {
    await this.resolveNudge(() => this.peopleApi.recordContact(personId));
  }

  /** "Not today" — equal calm, no guilt; the nudge simply goes quiet. */
  async snoozeNudge(personId: string): Promise<void> {
    await this.resolveNudge(() => this.peopleApi.snooze(personId));
  }

  private async resolveNudge(call: () => Promise<unknown>): Promise<void> {
    const snapshot = this.state();
    this.patch((t) => ({ ...t, people: { ...t.people, nudge: null } }));

    try {
      await call();
      this.refetchQuietly();
    } catch (error) {
      this.state.set(snapshot ?? null);
      throw error;
    }
  }

  /**
   * Patches the DTO and re-derives `ritualCompletedToday` from the patched
   * slices so the hero flips without waiting for the server round trip.
   */
  private patch(mutate: (t: TodayDto) => TodayDto): void {
    this.state.update((t) => {
      if (!t) return t;
      const next = mutate(t);
      return {
        ...next,
        ritualCompletedToday:
          next.checkIn !== null && (next.reading === null || next.reading.completedToday),
      };
    });
  }

  /** Background refetch after a successful mutation; failures keep the optimistic state. */
  private refetchQuietly(): void {
    void this.load().catch(() => undefined);
  }

  private onVisibilityChange(): void {
    if (this.document.visibilityState !== 'visible') return;
    const cached = this.state();
    if (cached && cached.date !== toIsoDate(appNow())) {
      this.refetchQuietly();
    }
  }
}
