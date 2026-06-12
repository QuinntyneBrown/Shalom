import { TodayDto } from 'api';

import { DiscoveryState, evaluateDiscovery } from './discovery';

function makeToday(overrides?: {
  checkInCurrent?: number;
  fastingLongest?: number;
  ritualCompletedToday?: boolean;
}): TodayDto {
  return {
    date: '2026-06-12',
    greetingName: 'quinn',
    checkIn: null,
    verse: { reference: 'John 3:16', text: 'For God so loved the world.', youVersionUrl: 'https://www.bible.com/bible/111/JHN.3.16' },
    reading: null,
    streaks: {
      checkInCurrent: overrides?.checkInCurrent ?? 0,
      checkInLongest: 0,
      readingCurrent: 0,
      readingLongest: 0,
      fastingCurrent: 0,
      fastingLongest: overrides?.fastingLongest ?? 0,
      movementCurrent: 0,
      movementLongest: 0,
    },
    fasting: { current: null, todayWindow: { start: '12:00:00', end: '20:00:00' }, windowOpen: false, targetHours: 16 },
    health: { todaysWorkouts: [], lastMeal: null },
    people: { nudge: null, upcomingDates: [], prayerFocus: { name: 'your church', line: 'Pray.', tomorrowName: 'FaithTech' } },
    ritualCompletedToday: overrides?.ritualCompletedToday ?? false,
  };
}

function makeState(overrides?: Partial<DiscoveryState>): DiscoveryState {
  return {
    firstOpenIso: '2026-06-12',
    lastShownIso: null,
    lastShownId: null,
    snoozedUntil: {},
    done: [],
    ...overrides,
  };
}

const TODAY = '2026-06-12';

describe('evaluateDiscovery', () => {
  it('shows nothing on day one with no conditions met', () => {
    expect(evaluateDiscovery(makeToday(), makeState(), TODAY)).toBeNull();
  });

  it('surfaces the streak card once three mornings are complete', () => {
    const card = evaluateDiscovery(makeToday({ checkInCurrent: 3 }), makeState(), TODAY);
    expect(card?.id).toBe('streaks');
  });

  it('surfaces the schedule editor after the first completed fast', () => {
    const card = evaluateDiscovery(makeToday({ fastingLongest: 1 }), makeState(), TODAY);
    expect(card?.id).toBe('fast-schedule');
    expect(card?.ctaRoute).toBe('/settings');
  });

  it('surfaces meal notes on day 5 of use', () => {
    const state = makeState({ firstOpenIso: '2026-06-08' }); // days of use = 5
    expect(evaluateDiscovery(makeToday(), state, TODAY)?.id).toBe('meal-notes');

    const dayFour = makeState({ firstOpenIso: '2026-06-09' });
    expect(evaluateDiscovery(makeToday(), dayFour, TODAY)).toBeNull();
  });

  it('surfaces the soon-teasers in week 2 and week 3', () => {
    const week2 = makeState({ firstOpenIso: '2026-06-01', done: ['meal-notes'] }); // day 12
    const reflection = evaluateDiscovery(makeToday(), week2, TODAY);
    expect(reflection?.id).toBe('evening-reflection');
    expect(reflection?.soon).toBe(true);
    expect(reflection?.ctaRoute).toBeNull();

    const week3 = makeState({
      firstOpenIso: '2026-05-25', // day 19
      done: ['meal-notes', 'evening-reflection'],
    });
    const trends = evaluateDiscovery(makeToday(), week3, TODAY);
    expect(trends?.id).toBe('trends');
    expect(trends?.soon).toBe(true);
  });

  it('surfaces the push opt-in after the first completed ritual when the env allows', () => {
    const today = makeToday({ ritualCompletedToday: true });
    const card = evaluateDiscovery(today, makeState(), TODAY, { pushOptIn: true });

    expect(card?.id).toBe('push-nudges');
    expect(card?.body).toBe('Want a tap on the shoulder when your eating window opens?');
    expect(card?.ctaLabel).toBe('Turn on');
    expect(card?.ctaRoute).toBeNull(); // the host runs the subscribe flow
  });

  it('keeps the push card away until the ritual is completed', () => {
    expect(
      evaluateDiscovery(makeToday(), makeState(), TODAY, { pushOptIn: true }),
    ).toBeNull();
  });

  it('keeps the push card away when the environment cannot push (default env)', () => {
    expect(
      evaluateDiscovery(makeToday({ ritualCompletedToday: true }), makeState(), TODAY),
    ).toBeNull();
  });

  it('push dismissal is the standard 7-day snooze', () => {
    const today = makeToday({ ritualCompletedToday: true });
    const snoozed = makeState({ snoozedUntil: { 'push-nudges': '2026-06-19' } });
    expect(evaluateDiscovery(today, snoozed, TODAY, { pushOptIn: true })).toBeNull();

    const expired = makeState({ snoozedUntil: { 'push-nudges': '2026-06-12' } });
    expect(evaluateDiscovery(today, expired, TODAY, { pushOptIn: true })?.id).toBe('push-nudges');
  });

  it('only ever returns one card — highest-priority eligible wins', () => {
    const everything = makeToday({ checkInCurrent: 5, fastingLongest: 2 });
    const state = makeState({ firstOpenIso: '2026-05-01' });
    expect(evaluateDiscovery(everything, state, TODAY)?.id).toBe('streaks');
  });

  it('never shows two days in a row', () => {
    const state = makeState({ lastShownIso: '2026-06-11', lastShownId: 'streaks' });
    expect(evaluateDiscovery(makeToday({ checkInCurrent: 3 }), state, TODAY)).toBeNull();
  });

  it('keeps showing the same card for the rest of the day it was shown', () => {
    const today = makeToday({ checkInCurrent: 3, fastingLongest: 1 });
    const state = makeState({ lastShownIso: TODAY, lastShownId: 'fast-schedule' });
    expect(evaluateDiscovery(today, state, TODAY)?.id).toBe('fast-schedule');
  });

  it('a gap of two days makes cards eligible again', () => {
    const state = makeState({ lastShownIso: '2026-06-10', lastShownId: 'streaks' });
    expect(evaluateDiscovery(makeToday({ checkInCurrent: 3 }), state, TODAY)?.id).toBe('streaks');
  });

  it('dismissal snoozes for seven days, then the card may return', () => {
    const snoozed = makeState({ snoozedUntil: { streaks: '2026-06-19' } });
    expect(evaluateDiscovery(makeToday({ checkInCurrent: 3 }), snoozed, TODAY)).toBeNull();

    const expired = makeState({ snoozedUntil: { streaks: '2026-06-12' } });
    expect(evaluateDiscovery(makeToday({ checkInCurrent: 3 }), expired, TODAY)?.id).toBe('streaks');
  });

  it('a retired card never returns and the next one steps up', () => {
    const today = makeToday({ checkInCurrent: 3, fastingLongest: 1 });
    const state = makeState({ done: ['streaks'] });
    expect(evaluateDiscovery(today, state, TODAY)?.id).toBe('fast-schedule');
  });
});
