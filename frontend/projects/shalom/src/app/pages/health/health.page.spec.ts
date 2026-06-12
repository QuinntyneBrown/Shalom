import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import {
  CurrentFastDto,
  FASTING_SERVICE,
  FastingSessionDto,
  IFastingService,
  IMealsService,
  IWorkoutsService,
  MEALS_SERVICE,
  MealEntryDto,
  WORKOUTS_SERVICE,
  WorkoutDto,
} from 'api';
import { SheetOpener } from '../../dialogs/sheet';
import { HealthPage } from './health.page';

const HOUR = 3_600_000;

function fastStarted(hoursAgo: number): FastingSessionDto {
  return {
    id: 'fast-1',
    startedAt: new Date(Date.now() - hoursAgo * HOUR).toISOString(),
    targetHours: 16,
    endedAt: null,
    elapsedHours: hoursAgo,
    outcome: null,
  };
}

function currentFast(current: FastingSessionDto | null): CurrentFastDto {
  return {
    current,
    schedule: {
      eatingWindowStart: '12:00:00',
      eatingWindowEnd: '20:00:00',
      targetFastHours: 16,
      timeZoneId: 'America/Toronto',
      overrides: [
        { dayOfWeek: 'Sunday', eatingWindowStart: '13:30:00', eatingWindowEnd: '20:30:00' },
      ],
      todayWindow: { start: '11:00:00', end: '19:00:00' },
    },
  };
}

const bikeWorkout: WorkoutDto = {
  id: 'w-1',
  equipment: 'IndoorBike',
  startedAt: new Date().toISOString(),
  durationMinutes: 24,
  distanceKm: null,
  avgHeartRateBpm: null,
  activeCalories: null,
  notes: 'effort:steady',
};

const meal: MealEntryDto = {
  id: 'm-1',
  text: 'salmon + greens',
  tags: ['home-cooked', 'fish'],
  occurredAt: new Date().toISOString(),
};

describe('HealthPage', () => {
  let fixture: ComponentFixture<HealthPage>;
  let fastingMock: IFastingService;
  let workoutsMock: IWorkoutsService;
  let mealsMock: IMealsService;
  let sheetResult: unknown;
  let openSheet: ReturnType<typeof vi.fn>;

  /** Drains the microtask queue so the page's async load chain settles (fake-timer safe). */
  async function flushMicrotasks(rounds = 10): Promise<void> {
    for (let i = 0; i < rounds; i++) await Promise.resolve();
  }

  async function configure(options?: {
    current?: FastingSessionDto | null;
    workouts?: WorkoutDto[];
    meals?: MealEntryDto[];
  }): Promise<void> {
    fastingMock = {
      getCurrent: vi.fn(async () => currentFast(options?.current ?? null)),
      start: vi.fn(),
      end: vi.fn(),
      history: vi.fn(async () => []),
      updateSchedule: vi.fn(),
    } as unknown as IFastingService;
    workoutsMock = {
      log: vi.fn(),
      list: vi.fn(async () => options?.workouts ?? []),
      delete: vi.fn(),
    } as unknown as IWorkoutsService;
    mealsMock = {
      log: vi.fn(),
      list: vi.fn(async () => options?.meals ?? []),
    } as unknown as IMealsService;
    openSheet = vi.fn(() => ({ closed: of(sheetResult) }));

    await TestBed.configureTestingModule({
      imports: [HealthPage],
      providers: [
        provideRouter([]),
        { provide: FASTING_SERVICE, useValue: fastingMock },
        { provide: WORKOUTS_SERVICE, useValue: workoutsMock },
        { provide: MEALS_SERVICE, useValue: mealsMock },
        { provide: SheetOpener, useValue: { open: openSheet } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HealthPage);
    fixture.detectChanges();
  }

  async function setup(options?: Parameters<typeof configure>[0]): Promise<void> {
    await configure(options);
    // The page's load() chains several awaits (Promise.all of three
    // requests); zoneless whenStable() doesn't track untracked promises,
    // so drain the microtask queue explicitly.
    await flushMicrotasks();
    fixture.detectChanges();
  }

  function text(testid: string): string {
    return (
      fixture.nativeElement.querySelector(`[data-testid="${testid}"]`)?.textContent ?? ''
    ).trim();
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the live elapsed, the window line, and the fasting status pill', async () => {
    await setup({ current: fastStarted(11.4) });

    expect(text('sh-fasting-elapsed')).toBe('11h 24m');
    expect(text('sh-fasting-window')).toBe('Window opens 11:00');
    expect(text('sh-health-status-pill')).toContain('Fasting · 11h 24m');
    expect(text('sh-fasting-target')).toBe('16:8');
  });

  it('ticks the elapsed label as time passes (fake timers)', async () => {
    vi.useFakeTimers();
    await configure({ current: fastStarted(11.4) });
    await flushMicrotasks();
    fixture.detectChanges();
    expect(text('sh-fasting-elapsed')).toBe('11h 24m');

    vi.advanceTimersByTime(60_000);
    await flushMicrotasks();
    fixture.detectChanges();

    expect(text('sh-fasting-elapsed')).toBe('11h 25m');
  });

  it('shows the quiet eating-window state when no fast is open', async () => {
    await setup({ current: null });

    expect(text('sh-fasting-elapsed')).toBe('Not fasting');
    expect(text('sh-fasting-window')).toBe('Window 11:00 – 19:00');
    expect(text('sh-health-status-pill')).toContain('Eating window');
  });

  it('lists the two most recent workouts and the weekly count', async () => {
    const treadmill: WorkoutDto = {
      ...bikeWorkout,
      id: 'w-2',
      equipment: 'Treadmill',
      durationMinutes: 31,
    };
    const old: WorkoutDto = { ...bikeWorkout, id: 'w-3', equipment: 'Elliptical' };
    await setup({ workouts: [bikeWorkout, treadmill, old] });

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="sh-recent-workouts"] sh-stat-row');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Bike · 24 min');
    expect(rows[1].textContent).toContain('Treadmill · 31 min');
    expect(fixture.nativeElement.querySelector('[data-testid="sh-workouts-card"] .meta')?.textContent)
      .toContain('3 this week');
  });

  it('shows the last meal line', async () => {
    await setup({ meals: [meal] });
    expect(text('sh-last-meal')).toBe('Today: salmon + greens');
  });

  it('opens the workout sheet prefiltered to the tapped machine and refreshes on save', async () => {
    sheetResult = bikeWorkout;
    await setup({});

    (fixture.nativeElement.querySelector('[data-testid="sh-workout-chip-indoorbike"]') as HTMLButtonElement).click();

    expect(openSheet).toHaveBeenCalledTimes(1);
    expect(openSheet.mock.calls[0][1]).toEqual({ equipment: 'IndoorBike' });
    // Initial load + refresh after the sheet closed with a saved workout.
    expect(workoutsMock.list).toHaveBeenCalledTimes(2);
  });

  it('the add button opens the sheet with no preselected machine', async () => {
    sheetResult = undefined;
    await setup({});

    (fixture.nativeElement.querySelector('[data-testid="sh-workout-add"]') as HTMLButtonElement).click();

    expect(openSheet.mock.calls[0][1]).toEqual({ equipment: null });
    expect(workoutsMock.list).toHaveBeenCalledTimes(1);
  });

  it('opens the meal sheet and shows the saved meal as the last meal', async () => {
    sheetResult = meal;
    await setup({});

    (fixture.nativeElement.querySelector('[data-testid="sh-log-meal"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(openSheet).toHaveBeenCalledTimes(1);
    expect(text('sh-last-meal')).toBe('Today: salmon + greens');
  });
});
