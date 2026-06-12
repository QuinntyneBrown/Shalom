import { TodayDto } from 'api';

import { daysBetweenIso } from './people-format';

/**
 * Progressive disclosure (CLAUDE.md UX rules): features are *surfaced* via
 * ONE Discovery card at a time, never locked, never two days in a row, and
 * a dismissal snoozes that card for seven days. The engine itself is pure;
 * `DiscoveryStorage` is the thin localStorage adapter around it
 * (`sh.discovery.*` keys).
 */

export type DiscoveryId =
  | 'streaks'
  | 'fast-schedule'
  | 'meal-notes'
  | 'evening-reflection'
  | 'trends';

export interface DiscoveryCardModel {
  readonly id: DiscoveryId;
  readonly icon: string;
  readonly title: string;
  readonly body: string;
  /** Route the CTA navigates to; null for soon-teasers (no destination yet). */
  readonly ctaLabel: string | null;
  readonly ctaRoute: string | null;
  readonly soon: boolean;
}

export interface DiscoveryState {
  /** Local date the app was first opened (`yyyy-MM-dd`). */
  readonly firstOpenIso: string;
  /** Local date a card was last rendered, and which one. */
  readonly lastShownIso: string | null;
  readonly lastShownId: DiscoveryId | null;
  /** Per-card snooze-until local dates (dismiss = +7 days). */
  readonly snoozedUntil: Readonly<Partial<Record<DiscoveryId, string>>>;
  /** Cards permanently retired (CTA followed). */
  readonly done: readonly DiscoveryId[];
}

const CARDS: readonly DiscoveryCardModel[] = [
  {
    id: 'streaks',
    icon: 'wb_twilight',
    title: 'A rhythm is forming',
    body: 'Three mornings with you. Shalom will quietly count the days now — Sundays never break them.',
    ctaLabel: null,
    ctaRoute: null,
    soon: false,
  },
  {
    id: 'fast-schedule',
    icon: 'timer',
    title: 'First fast complete',
    body: 'The window is yours to shape — Sunday lunch already has its own grace.',
    ctaLabel: 'Adjust schedule',
    ctaRoute: '/settings',
    soon: false,
  },
  {
    id: 'meal-notes',
    icon: 'lightbulb',
    title: 'Meal notes',
    body: 'Jot what you ate — patterns, not calories.',
    ctaLabel: 'Try it',
    ctaRoute: '/health',
    soon: false,
  },
  {
    id: 'evening-reflection',
    icon: 'bedtime',
    title: 'Evening reflection',
    body: 'Close the day the way you open it — two quiet minutes.',
    ctaLabel: null,
    ctaRoute: null,
    soon: true,
  },
  {
    id: 'trends',
    icon: 'monitoring',
    title: 'Trends',
    body: 'What helps, gently. No charts shouting at you.',
    ctaLabel: null,
    ctaRoute: null,
    soon: true,
  },
];

/** Eligibility per card, judged only from the Today aggregate + days of use. */
function eligible(id: DiscoveryId, today: TodayDto, daysOfUse: number): boolean {
  switch (id) {
    case 'streaks':
      return today.streaks.checkInCurrent >= 3;
    case 'fast-schedule':
      return today.streaks.fastingLongest >= 1;
    case 'meal-notes':
      return daysOfUse >= 5;
    case 'evening-reflection':
      return daysOfUse >= 8; // week 2
    case 'trends':
      return daysOfUse >= 15; // week 3
  }
}

/**
 * The one card to show today, or null. Rules, in order:
 *  1. a card was shown yesterday → quiet day (never two days in a row);
 *  2. a card was already shown today → keep showing the same one (stable
 *     within the day) as long as it is still eligible;
 *  3. otherwise the first eligible, un-snoozed, un-retired card in
 *     declaration order.
 */
export function evaluateDiscovery(today: TodayDto, state: DiscoveryState, todayIso: string): DiscoveryCardModel | null {
  if (
    state.lastShownIso &&
    state.lastShownIso !== todayIso &&
    daysBetweenIso(state.lastShownIso, todayIso) === 1
  ) {
    return null;
  }

  const daysOfUse = daysBetweenIso(state.firstOpenIso, todayIso) + 1;
  const candidates = CARDS.filter(
    (card) =>
      !state.done.includes(card.id) &&
      !(state.snoozedUntil[card.id] && state.snoozedUntil[card.id]! > todayIso) &&
      eligible(card.id, today, daysOfUse),
  );

  if (state.lastShownIso === todayIso) {
    return candidates.find((card) => card.id === state.lastShownId) ?? null;
  }
  return candidates[0] ?? null;
}

// ---------------------------------------------------------------------------
// localStorage adapter (`sh.discovery.*`)

const FIRST_OPEN_KEY = 'sh.discovery.firstOpen';
const LAST_SHOWN_KEY = 'sh.discovery.lastShown';
const SNOOZE_PREFIX = 'sh.discovery.snooze.';
const DONE_KEY = 'sh.discovery.done';

const ALL_IDS: readonly DiscoveryId[] = CARDS.map((c) => c.id);

export class DiscoveryStorage {
  /** Reads state, stamping the first-open date on the very first call. */
  read(todayIso: string): DiscoveryState {
    let firstOpenIso = localStorage.getItem(FIRST_OPEN_KEY);
    if (!firstOpenIso) {
      firstOpenIso = todayIso;
      localStorage.setItem(FIRST_OPEN_KEY, firstOpenIso);
    }

    const lastShown = localStorage.getItem(LAST_SHOWN_KEY); // "yyyy-MM-dd:id"
    const sep = lastShown?.indexOf(':') ?? -1;
    const snoozedUntil: Partial<Record<DiscoveryId, string>> = {};
    for (const id of ALL_IDS) {
      const until = localStorage.getItem(SNOOZE_PREFIX + id);
      if (until) snoozedUntil[id] = until;
    }

    return {
      firstOpenIso,
      lastShownIso: sep > 0 ? lastShown!.slice(0, sep) : null,
      lastShownId: sep > 0 ? (lastShown!.slice(sep + 1) as DiscoveryId) : null,
      snoozedUntil,
      done: (localStorage.getItem(DONE_KEY)?.split(',') ?? []).filter((id): id is DiscoveryId =>
        (ALL_IDS as readonly string[]).includes(id),
      ),
    };
  }

  markShown(id: DiscoveryId, todayIso: string): void {
    localStorage.setItem(LAST_SHOWN_KEY, `${todayIso}:${id}`);
  }

  /** Dismiss = a 7-day snooze, never a lock. */
  snooze(id: DiscoveryId, todayIso: string): void {
    const [y, m, d] = todayIso.split('-').map(Number);
    const until = new Date(Date.UTC(y, m - 1, d + 7));
    const iso = `${until.getUTCFullYear()}-${String(until.getUTCMonth() + 1).padStart(2, '0')}-${String(until.getUTCDate()).padStart(2, '0')}`;
    localStorage.setItem(SNOOZE_PREFIX + id, iso);
  }

  /** CTA followed — the discovery did its job. */
  markDone(id: DiscoveryId): void {
    const done = new Set(localStorage.getItem(DONE_KEY)?.split(',') ?? []);
    done.add(id);
    localStorage.setItem(DONE_KEY, [...done].filter(Boolean).join(','));
  }
}
