import { TestBed } from '@angular/core/testing';

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
} from 'api';

import { TodayStore } from './today.store';

function makeToday(overrides?: Partial<TodayDto>): TodayDto {
  return {
    date: '2026-06-12',
    greetingName: 'quinntynebrown',
    checkIn: null,
    verse: {
      reference: 'Psalm 143:8',
      text: 'Cause me to hear your loving kindness in the morning.',
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
      prayerFocus: { name: 'Vanessa', line: 'Thank God for her.', tomorrowName: 'your daughters' },
    },
    ritualCompletedToday: false,
    ...overrides,
  };
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('TodayStore', () => {
  let store: TodayStore;
  let getTodayCalls: number;
  let todayResponse: TodayDto;

  let upsertImpl: ICheckInsService['upsertToday'];
  let completeDayImpl: IReadingService['completeDay'];
  let endFastImpl: IFastingService['end'];
  let recordContactImpl: IPeopleService['recordContact'];
  let snoozeImpl: IPeopleService['snooze'];

  beforeEach(() => {
    localStorage.clear();
    delete (window as { __shTestNow?: string }).__shTestNow;

    getTodayCalls = 0;
    todayResponse = makeToday();

    upsertImpl = async (req) => ({
      id: 'c-1',
      date: todayResponse.date,
      moodRating: req.moodRating,
      spiritualRating: req.spiritualRating,
      note: req.note ?? null,
    });
    completeDayImpl = async (dayId) => ({
      id: dayId,
      dayNumber: 12,
      passageReference: 'John 12',
      youVersionUrl: 'https://www.bible.com/bible/111/JHN.12',
      completedOn: todayResponse.date,
    });
    endFastImpl = async () => ({
      id: 'fast-1',
      startedAt: '2026-06-11T23:00:00Z',
      targetHours: 16,
      endedAt: '2026-06-12T11:00:00Z',
      elapsedHours: 12,
      outcome: 'EndedEarly',
    });
    recordContactImpl = async (id) => ({
      id,
      name: 'Vanessa',
      relationship: 'Wife',
      phone: null,
      contactCadenceDays: 2,
      notes: null,
      lastContactedOn: todayResponse.date,
      snoozedUntil: null,
    });
    snoozeImpl = recordContactImpl;

    const todayMock: ITodayService = {
      getToday: async () => {
        getTodayCalls++;
        return todayResponse;
      },
    };
    const checkInsMock: ICheckInsService = {
      upsertToday: (req) => upsertImpl(req),
      list: async () => [],
    };
    const readingMock: IReadingService = {
      getPlan: async () => {
        throw new Error('not used');
      },
      completeDay: (dayId) => completeDayImpl(dayId),
      uncompleteDay: async () => undefined,
    };
    const fastingMock = {
      getCurrent: async () => {
        throw new Error('not used');
      },
      start: async () => {
        throw new Error('not used');
      },
      end: () => endFastImpl(),
      history: async () => [],
      updateSchedule: async () => {
        throw new Error('not used');
      },
    } as unknown as IFastingService;
    const peopleMock = {
      recordContact: (id: string) => recordContactImpl(id),
      snooze: (id: string) => snoozeImpl(id),
    } as unknown as IPeopleService;

    TestBed.configureTestingModule({
      providers: [
        { provide: TODAY_SERVICE, useValue: todayMock },
        { provide: CHECK_INS_SERVICE, useValue: checkInsMock },
        { provide: READING_SERVICE, useValue: readingMock },
        { provide: FASTING_SERVICE, useValue: fastingMock },
        { provide: PEOPLE_SERVICE, useValue: peopleMock },
      ],
    });
    store = TestBed.inject(TodayStore);
  });

  it('load() exposes the aggregate through per-card computed views', async () => {
    await store.load();

    expect(store.loaded()).toBe(true);
    expect(store.verse()?.reference).toBe('Psalm 143:8');
    expect(store.reading()?.passageReference).toBe('John 12');
    expect(store.nudge()?.name).toBe('Vanessa');
    expect(store.prayerFocus()?.name).toBe('Vanessa');
    expect(store.ritualCompletedToday()).toBe(false);
    expect(store.streaksVisible()).toBe(true);
  });

  it('hides streaks before the third completed morning', async () => {
    todayResponse = makeToday({
      streaks: { ...makeToday().streaks, checkInCurrent: 2 },
    });
    await store.load();

    expect(store.streaksVisible()).toBe(false);
  });

  it('saveCheckIn patches optimistically before the server answers, then refetches', async () => {
    await store.load();
    expect(getTodayCalls).toBe(1);

    const gate = deferred<Awaited<ReturnType<ICheckInsService['upsertToday']>>>();
    upsertImpl = () => gate.promise;

    const saving = store.saveCheckIn({ moodRating: 4, spiritualRating: 3, note: 'calm' });

    // The optimistic patch is visible immediately — no await of the server.
    expect(store.checkIn()?.moodRating).toBe(4);
    expect(store.checkIn()?.note).toBe('calm');

    const saved = { id: 'c-9', date: '2026-06-12', moodRating: 4, spiritualRating: 3, note: 'calm' };
    todayResponse = { ...todayResponse, checkIn: saved }; // the server now knows it too
    gate.resolve(saved);
    await saving;
    await Promise.resolve();

    expect(store.checkIn()?.id).toBe('c-9');
    expect(getTodayCalls).toBe(2); // background refetch
  });

  it('saveCheckIn rolls back the optimistic patch and rethrows when the server fails', async () => {
    await store.load();

    upsertImpl = () => Promise.reject(new Error('offline'));

    await expect(
      store.saveCheckIn({ moodRating: 5, spiritualRating: 4, note: null }),
    ).rejects.toThrow('offline');

    expect(store.checkIn()).toBeNull();
    expect(store.ritualCompletedToday()).toBe(false);
    expect(getTodayCalls).toBe(1); // no refetch after a failure
  });

  it('completeReading flips completedToday optimistically and re-derives ritualCompletedToday', async () => {
    todayResponse = makeToday({
      checkIn: { id: 'c-1', date: '2026-06-12', moodRating: 4, spiritualRating: 3, note: null },
    });
    await store.load();
    expect(store.ritualCompletedToday()).toBe(false);

    const gate = deferred<Awaited<ReturnType<IReadingService['completeDay']>>>();
    completeDayImpl = () => gate.promise;

    const completing = store.completeReading();

    expect(store.reading()?.completedToday).toBe(true);
    expect(store.reading()?.completedCount).toBe(12);
    expect(store.ritualCompletedToday()).toBe(true);

    gate.resolve({
      id: 'day-12',
      dayNumber: 12,
      passageReference: 'John 12',
      youVersionUrl: 'https://www.bible.com/bible/111/JHN.12',
      completedOn: '2026-06-12',
    });
    await completing;
    expect(getTodayCalls).toBe(2);
  });

  it('completeReading rolls back on failure', async () => {
    await store.load();
    completeDayImpl = () => Promise.reject(new Error('offline'));

    await expect(store.completeReading()).rejects.toThrow('offline');

    expect(store.reading()?.completedToday).toBe(false);
    expect(store.reading()?.completedCount).toBe(11);
  });

  it('endFast clears the open session optimistically', async () => {
    await store.load();

    const gate = deferred<Awaited<ReturnType<IFastingService['end']>>>();
    endFastImpl = () => gate.promise;

    const ending = store.endFast();
    expect(store.fasting()?.current).toBeNull();

    gate.resolve({
      id: 'fast-1',
      startedAt: '2026-06-11T23:00:00Z',
      targetHours: 16,
      endedAt: '2026-06-12T11:00:00Z',
      elapsedHours: 12,
      outcome: 'EndedEarly',
    });
    await ending;
    expect(getTodayCalls).toBe(2);
  });

  it('recordContact and snoozeNudge quiet the nudge optimistically; failures restore it', async () => {
    await store.load();

    recordContactImpl = async (id) => {
      // A recorded contact suppresses the day's nudge server-side too.
      todayResponse = { ...todayResponse, people: { ...todayResponse.people, nudge: null } };
      return {
        id,
        name: 'Vanessa',
        relationship: 'Wife',
        phone: null,
        contactCadenceDays: 2,
        notes: null,
        lastContactedOn: todayResponse.date,
        snoozedUntil: null,
      };
    };
    await store.recordContact('p-1');
    expect(store.nudge()).toBeNull();

    todayResponse = makeToday(); // tomorrow: the nudge is back
    await store.load();
    snoozeImpl = () => Promise.reject(new Error('offline'));
    await expect(store.snoozeNudge('p-1')).rejects.toThrow('offline');
    expect(store.nudge()?.name).toBe('Vanessa');
  });

  it('refetches on visibilitychange when the cached date is no longer the device date', async () => {
    await store.load();
    expect(getTodayCalls).toBe(1);

    // Same date — nothing happens.
    localStorage.setItem('sh.testMode', '1');
    (window as { __shTestNow?: string }).__shTestNow = '2026-06-12T08:00:00';
    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    expect(getTodayCalls).toBe(1);

    // The PWA resumes tomorrow — the stale "today" must be replaced.
    (window as { __shTestNow?: string }).__shTestNow = '2026-06-13T06:00:00';
    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    expect(getTodayCalls).toBe(2);
  });
});
