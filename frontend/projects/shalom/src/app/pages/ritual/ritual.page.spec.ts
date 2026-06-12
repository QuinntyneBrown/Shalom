import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import {
  CHECK_INS_SERVICE,
  FASTING_SERVICE,
  ICheckInsService,
  IFastingService,
  IPeopleService,
  IReadingService,
  ITodayService,
  PEOPLE_SERVICE,
  READING_SERVICE,
  TODAY_SERVICE,
  TodayDto,
  UpsertCheckInRequest,
} from 'api';

import { toIsoDate } from '../../shared/health-format';
import { TodayStore } from '../../state/today.store';
import { RitualPage } from './ritual.page';

const baseToday: TodayDto = {
  date: '2026-06-12',
  greetingName: 'quinntynebrown',
  checkIn: null,
  verse: {
    reference: 'Psalm 143:8',
    text: 'Cause me to hear your loving kindness in the morning, for I trust in you.',
    youVersionUrl: 'https://www.bible.com/bible/111/PSA.143.8',
  },
  reading: {
    dayId: 'day-12',
    dayNumber: 12,
    passageReference: 'John 12',
    youVersionUrl: 'https://www.bible.com/bible/111/JHN.12',
    completedToday: false,
    planName: 'John & His Letters',
    completedCount: 11,
    totalDays: 28,
    nextPassageReference: 'John 12',
  },
  streaks: {
    checkInCurrent: 11,
    checkInLongest: 11,
    readingCurrent: 11,
    readingLongest: 11,
    fastingCurrent: 4,
    fastingLongest: 6,
    movementCurrent: 4,
    movementLongest: 5,
  },
  fasting: {
    current: null,
    todayWindow: { start: '11:00:00', end: '19:00:00' },
    windowOpen: false,
    targetHours: 16,
  },
  health: { todaysWorkouts: [], lastMeal: null },
  people: {
    nudge: {
      personId: 'p-1',
      name: 'Vanessa',
      relationship: 'Wife',
      prompt: 'Text Vanessa a good-morning.',
      phone: '+1 416 555 0100',
    },
    upcomingDates: [],
    prayerFocus: {
      name: 'Vanessa',
      line: "Thank God for her. Ask for one specific thing she's carrying this week.",
      tomorrowName: 'Olivia',
    },
  },
  ritualCompletedToday: false,
};

describe('RitualPage', () => {
  let fixture: ComponentFixture<RitualPage>;
  let router: Router;
  let todayResponse: TodayDto;
  let upsertCalls: UpsertCheckInRequest[];
  let completedDayIds: string[];

  async function setup(dto: TodayDto = baseToday): Promise<void> {
    localStorage.clear();
    todayResponse = dto;
    upsertCalls = [];
    completedDayIds = [];

    const todayMock: ITodayService = { getToday: async () => todayResponse };
    const checkInsMock: ICheckInsService = {
      upsertToday: async (req) => {
        upsertCalls.push(req);
        return {
          id: 'c-1',
          date: todayResponse.date,
          moodRating: req.moodRating,
          spiritualRating: req.spiritualRating,
          note: req.note ?? null,
        };
      },
      list: async () => [],
    };
    const readingMock: IReadingService = {
      getPlan: async () => {
        throw new Error('not used');
      },
      completeDay: async (dayId) => {
        completedDayIds.push(dayId);
        return {
          id: dayId,
          dayNumber: 12,
          passageReference: 'John 12',
          youVersionUrl: 'https://www.bible.com/bible/111/JHN.12',
          completedOn: todayResponse.date,
        };
      },
      uncompleteDay: async () => undefined,
    };

    await TestBed.configureTestingModule({
      imports: [RitualPage],
      providers: [
        provideRouter([]),
        { provide: TODAY_SERVICE, useValue: todayMock },
        { provide: CHECK_INS_SERVICE, useValue: checkInsMock },
        { provide: READING_SERVICE, useValue: readingMock },
        { provide: FASTING_SERVICE, useValue: {} as IFastingService },
        { provide: PEOPLE_SERVICE, useValue: {} as IPeopleService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    await TestBed.inject(TodayStore).load();

    fixture = TestBed.createComponent(RitualPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function byTestId<T extends HTMLElement>(id: string): T | null {
    return el().querySelector<T>(`[data-testid="${id}"]`);
  }

  function click(id: string): void {
    byTestId<HTMLButtonElement>(id)!.click();
    fixture.detectChanges();
  }

  function chooseMoodAndDot(): void {
    (el().querySelectorAll('sh-rating-chips button.chip')[3] as HTMLButtonElement).click(); // Steady
    (el().querySelectorAll('sh-dot-scale button.dot')[2] as HTMLButtonElement).click(); // dot 3
    fixture.detectChanges();
  }

  it('step 1 asks the question and gates Continue on both ratings', async () => {
    await setup();

    expect(byTestId('sh-ritual-step-checkin')!.textContent).toContain('How is your soul this morning?');
    const cta = byTestId<HTMLButtonElement>('sh-ritual-continue')!;
    expect(cta.disabled).toBe(true);

    chooseMoodAndDot();
    expect(cta.disabled).toBe(false);
  });

  it('Continue saves the check-in through the store and advances to scripture', async () => {
    await setup();
    chooseMoodAndDot();
    byTestId<HTMLInputElement>('sh-ritual-note')!.value = 'settled';
    byTestId<HTMLInputElement>('sh-ritual-note')!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    click('sh-ritual-continue');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(upsertCalls).toEqual([{ moodRating: 4, spiritualRating: 3, note: 'settled' }]);
    expect(byTestId('sh-ritual-step-scripture')).not.toBeNull();
    expect(byTestId('sh-ritual-verse-text')!.textContent).toContain('loving kindness');
    expect(byTestId('sh-ritual-verse-ref')!.textContent).toContain('Psalm 143:8 · WEB');
    expect(byTestId('sh-ritual-reading-passage')!.textContent).toContain('John 12');

    const link = byTestId<HTMLAnchorElement>('sh-ritual-youversion')!;
    expect(link.getAttribute('href')).toContain('bible.com');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('a saved check-in prefills step 1', async () => {
    await setup({
      ...baseToday,
      checkIn: { id: 'c-0', date: '2026-06-12', moodRating: 5, spiritualRating: 4, note: 'full' },
    });

    expect(el().querySelectorAll('sh-rating-chips button.chip')[4].classList).toContain('selected');
    expect(el().querySelectorAll('sh-dot-scale button.dot')[3].classList).toContain('selected');
    expect(byTestId<HTMLInputElement>('sh-ritual-note')!.value).toBe('full');
    expect(byTestId<HTMLButtonElement>('sh-ritual-continue')!.disabled).toBe(false);
  });

  it('Mark read completes the reading day and moves to the prayer focus', async () => {
    await setup();
    chooseMoodAndDot();
    click('sh-ritual-continue');

    expect(byTestId<HTMLButtonElement>('sh-ritual-mark-read')!.textContent).toContain('Mark read · Continue');
    click('sh-ritual-mark-read');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(completedDayIds).toEqual(['day-12']);
    expect(byTestId('sh-ritual-step-prayer')).not.toBeNull();
    expect(byTestId('sh-ritual-focus-name')!.textContent).toContain('Vanessa');
    expect(byTestId('sh-ritual-focus-line')!.textContent).toContain('Thank God for her');
  });

  it('an already-read day offers a plain Continue and completes nothing twice', async () => {
    await setup({
      ...baseToday,
      reading: { ...baseToday.reading!, completedToday: true },
    });
    chooseMoodAndDot();
    click('sh-ritual-continue');

    expect(byTestId<HTMLButtonElement>('sh-ritual-mark-read')!.textContent?.trim()).toBe('Continue');
    click('sh-ritual-mark-read');

    expect(completedDayIds).toEqual([]);
    expect(byTestId('sh-ritual-step-prayer')).not.toBeNull();
  });

  it('Amen reaches the day preview; an intention tap persists per local date', async () => {
    await setup();
    chooseMoodAndDot();
    click('sh-ritual-continue');
    click('sh-ritual-mark-read');
    click('sh-ritual-amen');

    expect(byTestId('sh-ritual-step-preview')).not.toBeNull();
    expect(byTestId('sh-ritual-preview-window')!.textContent).toContain('Opens 11:00 · closes 19:00');
    expect(byTestId('sh-ritual-preview-connection')!.textContent).toContain('Text Vanessa a good-morning.');

    click('sh-ritual-intention-IndoorBike');
    expect(localStorage.getItem(`sh.intention.${toIsoDate(new Date())}`)).toBe('IndoorBike');
    expect(byTestId('sh-ritual-preview-movement')!.textContent).toContain('Bike — 20 minutes, when it fits');
  });

  it('Done lands on the completion moment; tapping anywhere closes to /today', async () => {
    await setup();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    chooseMoodAndDot();
    click('sh-ritual-continue');
    click('sh-ritual-mark-read');
    click('sh-ritual-amen');
    click('sh-ritual-done');

    const complete = byTestId<HTMLButtonElement>('sh-ritual-complete')!;
    expect(complete.textContent).toContain('Shalom.');
    expect(complete.textContent).toContain('Go in peace. The day is ready for you.');
    expect(byTestId('sh-ritual-day-badge')!.textContent).toContain('Day 11 with you');
    expect(complete.textContent).toContain('tap anywhere to close');

    complete.click();
    expect(navigate).toHaveBeenCalledWith('/today');
  });

  it('the badge stays hidden before three completed mornings', async () => {
    await setup({
      ...baseToday,
      streaks: { ...baseToday.streaks, checkInCurrent: 2 },
    });
    chooseMoodAndDot();
    click('sh-ritual-continue');
    click('sh-ritual-mark-read');
    click('sh-ritual-amen');
    click('sh-ritual-done');

    expect(byTestId('sh-ritual-complete')).not.toBeNull();
    expect(byTestId('sh-ritual-day-badge')).toBeNull();
  });

  it('the X closes mid-ritual and keeps what was already saved', async () => {
    await setup();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    chooseMoodAndDot();
    click('sh-ritual-continue');
    await fixture.whenStable();

    click('sh-ritual-close');

    expect(navigate).toHaveBeenCalledWith('/today');
    expect(upsertCalls.length).toBe(1); // the step-1 save survives the early exit
    expect(TestBed.inject(TodayStore).checkIn()?.moodRating).toBe(4);
  });
});
