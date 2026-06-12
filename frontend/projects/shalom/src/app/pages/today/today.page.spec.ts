import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  CHECK_INS_SERVICE,
  CheckInDto,
  ICheckInsService,
  IReadingService,
  ITodayService,
  READING_SERVICE,
  TODAY_SERVICE,
  TodayDto,
  UpsertCheckInRequest,
} from 'api';
import { TodayPage } from './today.page';

const baseToday: TodayDto = {
  date: '2026-06-12',
  greetingName: 'quinntynebrown',
  checkIn: null,
  verse: {
    reference: 'John 3:16',
    text: 'For God so loved the world, that he gave his only born Son.',
    youVersionUrl: 'https://www.bible.com/bible/111/JHN.3.16',
  },
  reading: {
    dayId: 'day-1',
    dayNumber: 1,
    passageReference: 'John 1',
    youVersionUrl: 'https://www.bible.com/bible/111/JHN.1',
    completedToday: false,
    planName: 'John & His Letters',
    completedCount: 0,
    totalDays: 28,
  },
  streaks: {
    checkInCurrent: 0,
    checkInLongest: 0,
    readingCurrent: 0,
    readingLongest: 0,
    fastingCurrent: 0,
    fastingLongest: 0,
    movementCurrent: 0,
    movementLongest: 0,
  },
  fasting: {
    current: null,
    todayWindow: { start: '12:00:00', end: '20:00:00' },
    windowOpen: false,
    targetHours: 16,
  },
  health: { todaysWorkouts: [], lastMeal: null },
};

describe('TodayPage', () => {
  let fixture: ComponentFixture<TodayPage>;
  let todayResponse: TodayDto;
  let upsertCalls: UpsertCheckInRequest[];
  let completedDayIds: string[];

  async function setup(dto: TodayDto): Promise<void> {
    todayResponse = dto;
    upsertCalls = [];
    completedDayIds = [];

    const todayMock: ITodayService = {
      getToday: async () => todayResponse,
    };
    const checkInsMock: ICheckInsService = {
      upsertToday: async (req) => {
        upsertCalls.push(req);
        const saved: CheckInDto = {
          id: 'c-1',
          date: todayResponse.date,
          moodRating: req.moodRating,
          spiritualRating: req.spiritualRating,
          note: req.note ?? null,
        };
        return saved;
      },
      list: async () => [],
    };
    const readingMock: IReadingService = {
      getPlan: async () => {
        throw new Error('not used');
      },
      completeDay: async (dayId) => {
        completedDayIds.push(dayId);
        todayResponse = {
          ...todayResponse,
          reading: todayResponse.reading
            ? { ...todayResponse.reading, completedToday: true, completedCount: 1 }
            : null,
        };
        return {
          id: dayId,
          dayNumber: 1,
          passageReference: 'John 1',
          youVersionUrl: 'https://www.bible.com/bible/111/JHN.1',
          completedOn: todayResponse.date,
        };
      },
      uncompleteDay: async () => undefined,
    };

    await TestBed.configureTestingModule({
      imports: [TodayPage],
      providers: [
        provideRouter([]),
        { provide: TODAY_SERVICE, useValue: todayMock },
        { provide: CHECK_INS_SERVICE, useValue: checkInsMock },
        { provide: READING_SERVICE, useValue: readingMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodayPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('renders greeting, verse, and reading from GET /api/today', async () => {
    await setup(baseToday);
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.greeting')?.textContent).toContain('quinntynebrown');
    expect(el.querySelector('sh-verse-card .text')?.textContent).toContain(
      'For God so loved the world',
    );
    expect(el.querySelector('sh-reading-card .passage')?.textContent).toContain('John 1');
  });

  it('saves a check-in through the token service and shows the saved state', async () => {
    await setup(baseToday);
    const el: HTMLElement = fixture.nativeElement;

    (el.querySelectorAll('sh-rating-chips button.chip')[3] as HTMLButtonElement).click(); // Steady
    (el.querySelectorAll('sh-dot-scale button.dot')[2] as HTMLButtonElement).click(); // 3
    fixture.detectChanges();

    const save = el.querySelector('button.save') as HTMLButtonElement;
    expect(save.disabled).toBe(false);
    save.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(upsertCalls).toEqual([{ moodRating: 4, spiritualRating: 3, note: null }]);
    expect(el.querySelector('.saved-badge')?.textContent?.trim()).toBe('Saved');
  });

  it('disables save until both ratings are chosen', async () => {
    await setup(baseToday);
    const el: HTMLElement = fixture.nativeElement;

    const save = el.querySelector('button.save') as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    (el.querySelectorAll('sh-rating-chips button.chip')[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(save.disabled).toBe(true);

    (el.querySelectorAll('sh-dot-scale button.dot')[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(save.disabled).toBe(false);
  });

  it('pre-selects chips from a saved check-in on load', async () => {
    await setup({
      ...baseToday,
      checkIn: { id: 'c-1', date: '2026-06-12', moodRating: 4, spiritualRating: 3, note: 'calm' },
    });
    const el: HTMLElement = fixture.nativeElement;

    const chips = el.querySelectorAll('sh-rating-chips button.chip');
    expect(chips[3].classList.contains('selected')).toBe(true);
    const dots = el.querySelectorAll('sh-dot-scale button.dot');
    expect(dots[2].classList.contains('selected')).toBe(true);
    expect((el.querySelector('input.note') as HTMLInputElement).value).toBe('calm');
    expect(el.querySelector('.saved-badge')).not.toBeNull();
  });

  it('renders the compact fasting card with the window line', async () => {
    await setup({
      ...baseToday,
      fasting: {
        current: {
          id: 'fast-1',
          startedAt: new Date(Date.now() - 11.4 * 3_600_000).toISOString(),
          targetHours: 16,
          endedAt: null,
          elapsedHours: 11.4,
          outcome: null,
        },
        todayWindow: { start: '11:00:00', end: '19:00:00' },
        windowOpen: false,
        targetHours: 16,
      },
    });
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('[data-testid="sh-today-fasting-elapsed"]')?.textContent).toContain('11h');
    expect(el.querySelector('[data-testid="sh-today-fasting-window"]')?.textContent).toContain(
      'Window opens at 11:00',
    );
    expect(el.querySelector('.fasting-card .ratio')?.textContent).toBe('16:8');
    expect(el.querySelector('.fasting-card sh-progress-ring')).not.toBeNull();
  });

  it('shows the quiet not-fasting state when no fast is open', async () => {
    await setup({
      ...baseToday,
      fasting: { ...baseToday.fasting, windowOpen: true },
    });
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('[data-testid="sh-today-fasting-elapsed"]')?.textContent?.trim()).toBe(
      'Not fasting',
    );
    expect(el.querySelector('[data-testid="sh-today-fasting-window"]')?.textContent).toContain(
      'Window open until 20:00',
    );
  });

  it('marking the reading read completes the day and refreshes the aggregate', async () => {
    await setup(baseToday);
    const el: HTMLElement = fixture.nativeElement;

    (el.querySelector('sh-reading-card .mark-read') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(completedDayIds).toEqual(['day-1']);
    expect(el.querySelector('sh-reading-card .mark-read')).toBeNull();
    expect(el.querySelector('sh-reading-card .done')?.textContent).toContain('Read today');
    expect(el.querySelector('sh-reading-card .progress')?.textContent?.trim()).toBe('1 of 28 read');
  });
});
