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
  CurrentFastDto,
  EQUIPMENT_LABELS,
  EquipmentType,
  FASTING_SERVICE,
  FastingSessionDto,
  MEALS_SERVICE,
  MealEntryDto,
  WORKOUTS_SERVICE,
  WorkoutDto,
} from 'api';
import { ProgressRing, StatRow, WeekDayState, WeekStrip } from 'components';

import { MealLogDialog } from '../../dialogs/meal-log.dialog';
import { SheetOpener } from '../../dialogs/sheet';
import { WorkoutLogDialog, WorkoutLogData } from '../../dialogs/workout-log.dialog';
import {
  addDays,
  formatElapsed,
  formatWindowTime,
  localDateOf,
  mondayOf,
  toIsoDate,
} from '../../shared/health-format';

/**
 * Health pillar (design 10): fasting summary with a LIVE elapsed ring (a
 * 1-second ticker recomputes from `current.startedAt` client-side — the
 * server snapshot only seeds it), the this-week rhythm strip (completed
 * fasts + workouts), quick-log workout chips that all open the workout
 * bottom sheet, and the meals card.
 */
@Component({
  selector: 'app-health',
  standalone: true,
  imports: [DatePipe, ProgressRing, RouterLink, StatRow, WeekStrip],
  templateUrl: './health.page.html',
  styleUrl: './health.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthPage implements OnInit, OnDestroy {
  private readonly fasting = inject(FASTING_SERVICE);
  private readonly workoutsApi = inject(WORKOUTS_SERVICE);
  private readonly mealsApi = inject(MEALS_SERVICE);
  private readonly sheets = inject(SheetOpener);

  protected readonly machines: readonly EquipmentType[] = [
    'Treadmill',
    'IndoorBike',
    'Elliptical',
    'OutdoorWalk',
    'OutdoorRun',
  ];
  protected readonly labels = EQUIPMENT_LABELS;

  protected readonly fast = signal<CurrentFastDto | null>(null);
  protected readonly weekFasts = signal<FastingSessionDto[]>([]);
  protected readonly workouts = signal<WorkoutDto[]>([]);
  protected readonly lastMeal = signal<MealEntryDto | null>(null);

  /** 1s heartbeat driving the live elapsed label and ring. */
  protected readonly now = signal(Date.now());
  private tick: ReturnType<typeof setInterval> | null = null;

  protected readonly current = computed(() => this.fast()?.current ?? null);

  protected readonly elapsedLabel = computed(() => {
    const current = this.current();
    return current ? formatElapsed(this.now() - Date.parse(current.startedAt)) : null;
  });

  protected readonly progress = computed(() => {
    const current = this.current();
    if (!current) return 0;
    const targetMs = current.targetHours * 3_600_000;
    return targetMs > 0 ? (this.now() - Date.parse(current.startedAt)) / targetMs : 0;
  });

  protected readonly ratio = computed(() => {
    const schedule = this.fast()?.schedule;
    return schedule ? `${schedule.targetFastHours}:${24 - schedule.targetFastHours}` : '';
  });

  protected readonly windowLine = computed(() => {
    const schedule = this.fast()?.schedule;
    if (!schedule) return '';
    const start = formatWindowTime(schedule.todayWindow.start);
    const end = formatWindowTime(schedule.todayWindow.end);
    return this.current() ? `Window opens ${start}` : `Window ${start} – ${end}`;
  });

  protected readonly statusPill = computed(() => {
    const elapsed = this.elapsedLabel();
    return elapsed ? `Fasting · ${elapsed}` : 'Eating window';
  });

  /** Monday-first dates (yyyy-MM-dd) of the current week, browser-local. */
  private readonly weekDates = computed(() => {
    const monday = mondayOf(new Date(this.now()));
    return Array.from({ length: 7 }, (_, i) => toIsoDate(addDays(monday, i)));
  });

  protected readonly weekStates = computed<WeekDayState[]>(() => {
    const today = toIsoDate(new Date(this.now()));
    const done = new Set<string>([
      ...this.weekFasts()
        .filter((s) => s.outcome === 'Completed' && s.endedAt)
        .map((s) => localDateOf(s.endedAt!)),
      ...this.workouts().map((w) => localDateOf(w.startedAt)),
    ]);
    return this.weekDates().map((d) =>
      d > today ? 'ahead' : done.has(d) ? 'done' : 'grace',
    );
  });

  protected readonly recentWorkouts = computed(() => this.workouts().slice(0, 2));

  protected readonly thisWeekCount = computed(() => {
    const monday = this.weekDates()[0];
    return this.workouts().filter((w) => localDateOf(w.startedAt) >= monday).length;
  });

  protected readonly lastMealLine = computed(() => {
    const meal = this.lastMeal();
    if (!meal) return 'Nothing logged yet';
    const day = localDateOf(meal.occurredAt);
    const today = toIsoDate(new Date(this.now()));
    const yesterday = toIsoDate(addDays(new Date(this.now()), -1));
    const prefix = day === today ? 'Today' : day === yesterday ? 'Last night' : 'Last';
    return `${prefix}: ${meal.text}`;
  });

  ngOnInit(): void {
    this.tick = setInterval(() => this.now.set(Date.now()), 1_000);
    void this.load();
  }

  ngOnDestroy(): void {
    if (this.tick !== null) clearInterval(this.tick);
  }

  protected workoutLabel(w: WorkoutDto): string {
    return `${this.labels[w.equipment]} · ${w.durationMinutes} min`;
  }

  protected openWorkoutSheet(equipment: EquipmentType | null): void {
    const ref = this.sheets.open<WorkoutDto | undefined, WorkoutLogData>(
      WorkoutLogDialog, { equipment });
    ref.closed.subscribe((saved) => {
      if (saved) void this.loadActivity();
    });
  }

  protected openMealSheet(): void {
    const ref = this.sheets.open<MealEntryDto | undefined>(MealLogDialog);
    ref.closed.subscribe((saved) => {
      if (saved) this.lastMeal.set(saved);
    });
  }

  private async load(): Promise<void> {
    const [fast] = await Promise.all([
      this.fasting.getCurrent(),
      this.loadActivity(),
      this.loadMeals(),
    ]);
    this.fast.set(fast);
  }

  /** Week strip + recent list share one 14-day window of data. */
  private async loadActivity(): Promise<void> {
    const today = new Date();
    const from = toIsoDate(addDays(today, -13));
    const to = toIsoDate(today);
    const [fasts, workouts] = await Promise.all([
      this.fasting.history(toIsoDate(mondayOf(today)), to),
      this.workoutsApi.list(from, to),
    ]);
    this.weekFasts.set(fasts);
    this.workouts.set(workouts);
  }

  private async loadMeals(): Promise<void> {
    const today = new Date();
    const meals = await this.mealsApi.list(toIsoDate(addDays(today, -13)), toIsoDate(today));
    this.lastMeal.set(meals[0] ?? null);
  }
}
