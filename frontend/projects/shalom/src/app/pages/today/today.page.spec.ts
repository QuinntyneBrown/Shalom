import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import {
  CHECK_INS_SERVICE,
  FASTING_SERVICE,
  ICheckInsService,
  IFastingService,
  IPeopleService,
  IPushService,
  IReadingService,
  ITodayService,
  PEOPLE_SERVICE,
  PUSH_SERVICE,
  READING_SERVICE,
  TODAY_SERVICE,
  TodayDto,
} from 'api';

import { SheetOpener } from '../../dialogs/sheet';
import { TodayPage } from './today.page';

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
    nextPassageReference: 'John 13',
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
    current: {
      id: 'fast-1',
      startedAt: '2026-06-11T23:00:00Z',
      targetHours: 16,
      endedAt: null,
      elapsedHours: 11.4,
      outcome: null,
    },
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
      prompt: 'Tell Vanessa one thing you appreciated about her this week.',
      phone: '+1 416 555 0100',
    },
    upcomingDates: [],
    prayerFocus: { name: 'Vanessa', line: 'Thank God for her.', tomorrowName: 'Olivia' },
  },
  ritualCompletedToday: false,
};

function pinClock(iso: string): void {
  localStorage.setItem('sh.testMode', '1');
  (window as { __shTestNow?: string }).__shTestNow = iso;
}

describe('TodayPage', () => {
  let fixture: ComponentFixture<TodayPage>;
  let contactedIds: string[];
  let snoozedIds: string[];
  let endFastCalls: number;
  let openSheet: ReturnType<typeof vi.fn>;

  async function setup(dto: TodayDto): Promise<void> {
    contactedIds = [];
    snoozedIds = [];
    endFastCalls = 0;
    openSheet = vi.fn(() => ({ closed: of(undefined) }));

    // `current` mirrors the server view so background refetches stay
    // consistent with the mutation that just happened.
    let current = dto;
    const todayMock: ITodayService = { getToday: async () => current };
    const checkInsMock = { upsertToday: vi.fn(), list: async () => [] } as unknown as ICheckInsService;
    const readingMock = {
      completeDay: vi.fn(),
      uncompleteDay: vi.fn(),
      getPlan: vi.fn(),
    } as unknown as IReadingService;
    const fastingMock = {
      end: async () => {
        endFastCalls++;
        return {
          id: 'fast-1',
          startedAt: '2026-06-11T23:00:00Z',
          targetHours: 16,
          endedAt: '2026-06-12T11:00:00Z',
          elapsedHours: 12,
          outcome: 'EndedEarly' as const,
        };
      },
    } as unknown as IFastingService;
    const peopleMock = {
      recordContact: async (id: string) => {
        contactedIds.push(id);
        current = { ...current, people: { ...current.people, nudge: null } };
        return {} as never;
      },
      snooze: async (id: string) => {
        snoozedIds.push(id);
        current = { ...current, people: { ...current.people, nudge: null } };
        return {} as never;
      },
    } as unknown as IPeopleService;

    await TestBed.configureTestingModule({
      imports: [TodayPage],
      providers: [
        provideRouter([]),
        { provide: TODAY_SERVICE, useValue: todayMock },
        { provide: CHECK_INS_SERVICE, useValue: checkInsMock },
        { provide: READING_SERVICE, useValue: readingMock },
        { provide: FASTING_SERVICE, useValue: fastingMock },
        { provide: PEOPLE_SERVICE, useValue: peopleMock },
        // No SwPush provider → PushReminders reads as 'unsupported' and the
        // push discovery card stays ineligible in these specs.
        { provide: PUSH_SERVICE, useValue: {} as IPushService },
        { provide: SheetOpener, useValue: { open: openSheet } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodayPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    localStorage.clear();
    delete (window as { __shTestNow?: string }).__shTestNow;
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function byTestId<T extends HTMLElement>(id: string): T | null {
    return el().querySelector<T>(`[data-testid="${id}"]`);
  }

  describe('morning', () => {
    it('shows the ritual hero with the streak badge, fasting, movement, and connection', async () => {
      pinClock('2026-06-12T06:11:00');
      await setup(baseToday);

      expect(el().querySelector('h1.greeting')!.textContent).toContain('Good morning, quinntynebrown');
      expect(byTestId('sh-today-status-pill')!.textContent).toMatch(/Fasting · \d+h \d+m · opens 11:00/);

      const hero = byTestId('sh-ritual-hero')!;
      expect(hero.textContent).toContain('Begin your morning');
      expect(hero.textContent).toContain('Check-in · Scripture · Prayer — about 2 minutes');
      expect(byTestId('sh-today-day-badge')!.textContent).toContain('Day 11');
      expect(byTestId<HTMLAnchorElement>('sh-ritual-begin')!.getAttribute('href')).toBe('/today/ritual');

      expect(byTestId('sh-today-fasting')).not.toBeNull();
      expect(byTestId('sh-today-fasting-window')!.textContent).toContain('Window opens at 11:00 — going strong');
      expect(byTestId('sh-today-movement')!.textContent).toContain('What feels right today?');
      expect(byTestId('sh-today-connection-prompt')!.textContent).toContain('Vanessa');
      expect(el().querySelector('p.streaks')!.textContent).toContain('11-day check-in rhythm');
    });

    it('replaces the hero with the compact morning-complete card once the ritual is done', async () => {
      pinClock('2026-06-12T08:00:00');
      await setup({
        ...baseToday,
        checkIn: { id: 'c-1', date: '2026-06-12', moodRating: 4, spiritualRating: 3, note: null },
        reading: { ...baseToday.reading!, completedToday: true },
        ritualCompletedToday: true,
      });

      expect(byTestId('sh-ritual-hero')).toBeNull();
      const complete = byTestId('sh-today-morning-complete')!;
      expect(complete.textContent).toContain('Morning complete');
      expect(complete.textContent).toContain('Psalm 143:8 · felt Steady');
    });

    it('hides every streak surface before three completed mornings', async () => {
      pinClock('2026-06-12T06:11:00');
      await setup({
        ...baseToday,
        streaks: { ...baseToday.streaks, checkInCurrent: 2 },
      });

      expect(byTestId('sh-today-day-badge')).toBeNull();
      expect(el().querySelector('p.streaks')).toBeNull();
      expect(byTestId('sh-today-movement')!.textContent).not.toContain('streak');
    });

    it('persists the tapped movement intention per local date', async () => {
      pinClock('2026-06-12T06:11:00');
      await setup(baseToday);

      byTestId<HTMLButtonElement>('sh-today-intention-IndoorBike')!.click();
      fixture.detectChanges();

      expect(localStorage.getItem('sh.intention.2026-06-12')).toBe('IndoorBike');
      expect(byTestId('sh-today-intention-IndoorBike')!.classList).toContain('selected');
    });

    it('surfaces one discovery card and a dismissal snoozes it for seven days', async () => {
      pinClock('2026-06-12T06:11:00');
      await setup(baseToday); // checkInCurrent 11 ⇒ the streak card is eligible

      const discovery = byTestId('sh-today-discovery')!;
      expect(discovery.textContent).toContain('A rhythm is forming');

      discovery.querySelector<HTMLButtonElement>('[data-testid="sh-discovery-dismiss"]')!.click();
      fixture.detectChanges();

      expect(byTestId('sh-today-discovery')).toBeNull();
      expect(localStorage.getItem('sh.discovery.snooze.streaks')).toBe('2026-06-19');
    });

    it('Done records the contact through the store and the nudge goes quiet at once', async () => {
      pinClock('2026-06-12T06:11:00');
      await setup(baseToday);

      byTestId<HTMLButtonElement>('sh-today-connection-done')!.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(contactedIds).toEqual(['p-1']);
      expect(byTestId('sh-today-connection')).toBeNull();
    });
  });

  describe('midday', () => {
    const midday: TodayDto = {
      ...baseToday,
      fasting: { ...baseToday.fasting, current: null, windowOpen: true },
    };

    it('offers the eating window with a closes-in countdown and a gentle morning reminder', async () => {
      pinClock('2026-06-12T12:47:00');
      await setup(midday);

      expect(el().querySelector('h1.greeting')!.textContent).toContain('Good afternoon');
      expect(byTestId('sh-today-status-pill')!.textContent).toContain('Window open · closes 19:00');

      const eating = byTestId('sh-today-eating-window')!;
      expect(eating.textContent).toContain('Break your fast well.');
      expect(byTestId('sh-today-window-countdown')!.textContent).toContain('closes in 6h 13m');

      const stillHere = byTestId('sh-today-still-here')!;
      expect(stillHere.textContent).toContain('Your morning is still here');
      expect(stillHere.textContent).not.toMatch(/missed|behind|late/i);
    });

    it('Log a meal ends an open fast first, then opens the meal sheet', async () => {
      pinClock('2026-06-12T12:47:00');
      await setup({ ...midday, fasting: { ...midday.fasting, current: baseToday.fasting.current } });

      byTestId<HTMLButtonElement>('sh-today-log-meal')!.click();
      await fixture.whenStable();

      expect(endFastCalls).toBe(1);
      expect(openSheet).toHaveBeenCalledTimes(1);
    });
  });

  describe('evening', () => {
    const evening: TodayDto = {
      ...baseToday,
      checkIn: { id: 'c-1', date: '2026-06-12', moodRating: 4, spiritualRating: 3, note: null },
      reading: { ...baseToday.reading!, completedToday: true },
      ritualCompletedToday: true,
      fasting: { ...baseToday.fasting, current: null, windowOpen: true },
    };

    it('counts the window down in gold under an hour and glances at tomorrow', async () => {
      pinClock('2026-06-12T18:20:00');
      await setup(evening);

      const closing = byTestId('sh-today-window-closing')!;
      expect(closing.textContent).toContain('Window closes in 40 minutes');
      expect(closing.textContent).toContain('Finish well — water after');
      expect(closing.classList).toContain('gold');

      expect(byTestId('sh-today-tomorrow')!.textContent).toContain('Reading: John 13 · Prayer: Olivia');
      expect(byTestId('sh-today-morning-complete')).not.toBeNull();
    });

    it('keeps the countdown neutral with more than an hour left', async () => {
      pinClock('2026-06-12T17:30:00');
      await setup(evening);

      const closing = byTestId('sh-today-window-closing')!;
      expect(closing.textContent).toContain('Window closes in 1h 30m');
      expect(closing.classList).not.toContain('gold');
    });

    it('"Not tonight" dismisses the movement nudge for the day with equal calm', async () => {
      pinClock('2026-06-12T18:20:00');
      await setup(evening);

      expect(byTestId('sh-today-evening-movement')!.textContent).toContain('Still time for 20 minutes');

      byTestId<HTMLButtonElement>('sh-today-movement-dismiss')!.click();
      fixture.detectChanges();

      expect(byTestId('sh-today-evening-movement')).toBeNull();
      expect(localStorage.getItem('sh.movement.dismissed.2026-06-12')).toBe('1');
    });
  });

  describe('offline (M7: writes are online-only)', () => {
    it('disables the API mutation buttons while offline and re-enables on reconnect', async () => {
      pinClock('2026-06-12T12:47:00');
      await setup({
        ...baseToday,
        fasting: { ...baseToday.fasting, current: null, windowOpen: true },
      });

      window.dispatchEvent(new Event('offline'));
      fixture.detectChanges();

      expect(byTestId<HTMLButtonElement>('sh-today-log-meal')!.disabled).toBe(true);
      expect(byTestId<HTMLButtonElement>('sh-today-connection-done')!.disabled).toBe(true);
      expect(byTestId<HTMLButtonElement>('sh-today-connection-snooze')!.disabled).toBe(true);

      window.dispatchEvent(new Event('online'));
      fixture.detectChanges();

      expect(byTestId<HTMLButtonElement>('sh-today-log-meal')!.disabled).toBe(false);
      expect(byTestId<HTMLButtonElement>('sh-today-connection-done')!.disabled).toBe(false);
    });

    it('keeps device-local choices available offline — only API writes pause', async () => {
      pinClock('2026-06-12T06:11:00');
      await setup(baseToday);

      window.dispatchEvent(new Event('offline'));
      fixture.detectChanges();

      // Movement intention is a localStorage fact; offline must not block it.
      const chip = byTestId<HTMLButtonElement>('sh-today-intention-Treadmill')!;
      expect(chip.disabled).toBe(false);
      chip.click();
      fixture.detectChanges();
      expect(localStorage.getItem('sh.intention.2026-06-12')).toBe('Treadmill');

      window.dispatchEvent(new Event('online'));
    });
  });

  describe('night', () => {
    it('rests: a verse fragment, no header, and not a single call to action', async () => {
      pinClock('2026-06-12T23:00:00');
      await setup(baseToday);

      const night = byTestId('sh-today-night')!;
      expect(night.textContent).toContain('He gives sleep to his loved ones.');
      expect(night.textContent).toContain('Psalm 127:2 · WEB');
      expect(night.textContent).toContain('Shalom. Rest well.');

      expect(el().querySelector('h1.greeting')).toBeNull();
      expect(el().querySelectorAll('button, a').length).toBe(0);
    });
  });
});
