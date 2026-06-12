import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import {
  CHECK_INS_SERVICE,
  CurrentFastDto,
  FASTING_SERVICE,
  FastingScheduleDto,
  ICheckInsService,
  IFastingService,
  IPeopleService,
  IReadingService,
  ISessionStore,
  ITodayService,
  PEOPLE_SERVICE,
  READING_SERVICE,
  SESSION_STORE,
  TODAY_SERVICE,
  TodayDto,
} from 'api';

import { SheetOpener } from '../../dialogs/sheet';
import { SettingsPage } from './settings.page';

const schedule: FastingScheduleDto = {
  eatingWindowStart: '12:00:00',
  eatingWindowEnd: '20:00:00',
  targetFastHours: 16,
  timeZoneId: 'America/Toronto',
  overrides: [
    { dayOfWeek: 'Sunday', eatingWindowStart: '13:30:00', eatingWindowEnd: '20:30:00' },
  ],
  todayWindow: { start: '12:00:00', end: '20:00:00' },
};

const todayDto: TodayDto = {
  date: '2026-06-12',
  greetingName: 'quinntynebrown',
  checkIn: null,
  verse: { reference: 'Psalm 143:8', text: 'Cause me to hear.', youVersionUrl: 'https://x' },
  reading: {
    dayId: 'day-12',
    dayNumber: 12,
    passageReference: 'John 12',
    youVersionUrl: 'https://x',
    completedToday: false,
    planName: 'John & His Letters',
    completedCount: 11,
    totalDays: 28,
    nextPassageReference: 'John 12',
  },
  streaks: {
    checkInCurrent: 0, checkInLongest: 0, readingCurrent: 0, readingLongest: 0,
    fastingCurrent: 0, fastingLongest: 0, movementCurrent: 0, movementLongest: 0,
  },
  fasting: { current: null, todayWindow: { start: '12:00:00', end: '20:00:00' }, windowOpen: false, targetHours: 16 },
  health: { todaysWorkouts: [], lastMeal: null },
  people: {
    nudge: null,
    upcomingDates: [],
    prayerFocus: { name: 'your church', line: 'Pray.', tomorrowName: 'FaithTech' },
  },
  ritualCompletedToday: false,
};

describe('SettingsPage', () => {
  let fixture: ComponentFixture<SettingsPage>;
  let router: Router;
  let logout: ReturnType<typeof vi.fn>;
  let openSheet: ReturnType<typeof vi.fn>;
  let sheetClosed: Subject<FastingScheduleDto | undefined>;

  async function setup(): Promise<void> {
    localStorage.clear();
    logout = vi.fn();
    sheetClosed = new Subject<FastingScheduleDto | undefined>();
    openSheet = vi.fn(() => ({ closed: sheetClosed.asObservable() }));

    const fastingMock = {
      getCurrent: async (): Promise<CurrentFastDto> => ({ current: null, schedule }),
    } as unknown as IFastingService;

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideRouter([]),
        { provide: SESSION_STORE, useValue: { logout } as unknown as ISessionStore },
        { provide: FASTING_SERVICE, useValue: fastingMock },
        { provide: TODAY_SERVICE, useValue: { getToday: async () => todayDto } as ITodayService },
        { provide: CHECK_INS_SERVICE, useValue: {} as ICheckInsService },
        { provide: READING_SERVICE, useValue: {} as IReadingService },
        { provide: PEOPLE_SERVICE, useValue: {} as IPeopleService },
        { provide: SheetOpener, useValue: { open: openSheet } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function el<T extends HTMLElement>(testid: string): T {
    return (fixture.nativeElement as HTMLElement).querySelector(
      `[data-testid="${testid}"]`,
    ) as T;
  }

  it('renders the grouped rows with their display values', async () => {
    await setup();
    const text = (fixture.nativeElement as HTMLElement).textContent!;

    expect(el('sh-settings-wake').textContent).toContain('6:00');
    expect(el('sh-settings-fasting').textContent).toContain('16:8');
    expect(el('sh-settings-quiet-days').textContent).toContain('Sun');
    expect(el('sh-settings-reading-plan').textContent).toContain('John & His Letters');
    expect(el('sh-settings-nudges').textContent).toContain('window only');
    expect(el('sh-settings-calendar').textContent).toContain('off');
    expect(el('sh-settings-about').textContent).toContain('0.1');
    expect(text).toContain('Everything Shalom can do');
  });

  it('opens the schedule editor sheet and reflects the saved schedule', async () => {
    await setup();

    el('sh-settings-fasting').click();
    expect(openSheet).toHaveBeenCalledTimes(1);
    expect(openSheet.mock.calls[0][1]).toEqual(schedule);

    sheetClosed.next({ ...schedule, targetFastHours: 14 });
    fixture.detectChanges();

    expect(el('sh-settings-fasting').textContent).toContain('14:10');
  });

  it('theme chips set and persist the override', async () => {
    await setup();

    el('sh-settings-theme-dawn').click();
    fixture.detectChanges();

    expect(localStorage.getItem('sh.theme')).toBe('dawn');
    expect(el('sh-settings-theme-dawn').classList).toContain('selected');

    el('sh-settings-theme-auto').click();
    fixture.detectChanges();
    expect(localStorage.getItem('sh.theme')).toBe('auto');
  });

  it('sign out logs the session out and returns to sign-in', async () => {
    await setup();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    el('sh-settings-sign-out').click();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/sign-in');
  });
});
