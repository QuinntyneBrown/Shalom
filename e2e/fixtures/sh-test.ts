/**
 * The Shalom test fixture.
 *
 * Wraps `@playwright/test`'s `test` with:
 *   - `pages` — namespaced POMs (`pages.signIn`, `pages.today`),
 *   - `signInAsSeededUser` — UI sign-in with the seeded account, landing
 *     on `/today` with the dashboard loaded,
 *   - `api` — a thin authenticated API client for test setup/teardown
 *     (e.g. uncompleting a reading day before the mark-read test).
 *
 * Specs import `test`/`expect` from this file, not `@playwright/test`.
 */

import { APIRequestContext, Page, expect, test as base } from '@playwright/test';

import { FastDetailPage } from '../pages/fast-detail.page';
import { HealthPage } from '../pages/health.page';
import { PeoplePage } from '../pages/people.page';
import { PersonDetailPage } from '../pages/person-detail.page';
import { RitualPage } from '../pages/ritual.page';
import { SettingsPage } from '../pages/settings.page';
import { SignInPage } from '../pages/sign-in.page';
import { TodayPage } from '../pages/today.page';
import { WelcomePage } from '../pages/welcome.page';
import { SEEDED_USER } from './users';

export const API_URL = 'http://localhost:5100';

interface Pages {
  signIn: SignInPage;
  today: TodayPage;
  ritual: RitualPage;
  health: HealthPage;
  fastDetail: FastDetailPage;
  people: PeoplePage;
  personDetail: PersonDetailPage;
  welcome: WelcomePage;
  settings: SettingsPage;
}

/**
 * Pins the app's clock (`appNow()`) for this page. The app honors
 * `window.__shTestNow` ONLY while `localStorage['sh.testMode'] === '1'` —
 * both are injected before any app script runs. Call BEFORE navigating;
 * the last pin wins (the auto fixture pins 08:00 local, so every spec
 * starts in a deterministic morning regardless of when the suite runs).
 */
export async function pinClock(page: Page, iso: string): Promise<void> {
  await page.addInitScript((pinned) => {
    try {
      window.localStorage.setItem('sh.testMode', '1');
      (window as unknown as { __shTestNow?: string }).__shTestNow = pinned;
    } catch {
      // about:blank and friends — the app origin will run this again.
    }
  }, iso);
}

export interface TodayReading {
  dayId: string;
  dayNumber: number;
  passageReference: string;
  youVersionUrl: string;
  completedToday: boolean;
  planName: string;
  completedCount: number;
  totalDays: number;
}

export interface TodayStreaks {
  checkInCurrent: number;
  checkInLongest: number;
  readingCurrent: number;
  readingLongest: number;
  fastingCurrent: number;
  fastingLongest: number;
  movementCurrent: number;
  movementLongest: number;
}

export interface PrayerFocus {
  name: string;
  line: string;
  tomorrowName: string;
}

export interface TodayAggregate {
  date: string;
  greetingName: string;
  checkIn: unknown | null;
  reading: TodayReading | null;
  streaks: TodayStreaks;
  ritualCompletedToday: boolean;
  people: {
    nudge: NudgeRow | null;
    upcomingDates: unknown[];
    prayerFocus: PrayerFocus;
  };
}

export interface FastSession {
  id: string;
  startedAt: string;
  targetHours: number;
  endedAt: string | null;
  elapsedHours: number;
  outcome: 'Completed' | 'EndedEarly' | null;
}

export interface FastingOverride {
  dayOfWeek:
    | 'Sunday'
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday';
  eatingWindowStart: string;
  eatingWindowEnd: string;
}

export interface FastingSchedule {
  eatingWindowStart: string;
  eatingWindowEnd: string;
  targetFastHours: number;
  timeZoneId: string;
  overrides: FastingOverride[];
  todayWindow: { start: string; end: string };
}

export interface CurrentFast {
  current: FastSession | null;
  schedule: FastingSchedule;
}

export interface WorkoutRow {
  id: string;
  equipment: 'Treadmill' | 'IndoorBike' | 'Elliptical';
  startedAt: string;
  durationMinutes: number;
  notes: string | null;
}

export interface MealRow {
  id: string;
  text: string;
  tags: string[];
  occurredAt: string;
}

export interface PersonRow {
  id: string;
  name: string;
  relationship: string | null;
  phone: string | null;
  contactCadenceDays: number | null;
  notes: string | null;
  lastContactedOn: string | null;
  snoozedUntil: string | null;
}

export interface NudgeRow {
  personId: string;
  name: string;
  relationship: string | null;
  prompt: string;
  phone: string | null;
}

/** `yyyy-MM-dd` in the runner's local timezone (matches the server's Toronto day on this machine). */
export function localIsoDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Authenticated REST helper against the seeded user, for test setup. */
export class ShalomApi {
  private token: string | null = null;

  constructor(private readonly request: APIRequestContext) {}

  private async bearer(): Promise<{ Authorization: string }> {
    if (!this.token) {
      const res = await this.request.post(`${API_URL}/api/auth/login`, {
        data: { email: SEEDED_USER.email, password: SEEDED_USER.password },
      });
      if (!res.ok()) {
        throw new Error(`API login failed (${res.status()}). Did prepare.mjs seed the database?`);
      }
      const body = await res.json();
      this.token = body.token.accessToken as string;
    }
    return { Authorization: `Bearer ${this.token}` };
  }

  async getToday(): Promise<TodayAggregate> {
    const res = await this.request.get(`${API_URL}/api/today`, {
      headers: await this.bearer(),
    });
    if (!res.ok()) throw new Error(`GET /api/today failed (${res.status()}).`);
    return (await res.json()) as TodayAggregate;
  }

  async uncompleteDay(dayId: string): Promise<void> {
    const res = await this.request.delete(
      `${API_URL}/api/reading/days/${dayId}/complete`,
      { headers: await this.bearer() },
    );
    if (!res.ok()) throw new Error(`DELETE day ${dayId} failed (${res.status()}).`);
  }

  async getCurrentFast(): Promise<CurrentFast> {
    const res = await this.request.get(`${API_URL}/api/fasting/current`, {
      headers: await this.bearer(),
    });
    if (!res.ok()) throw new Error(`GET /api/fasting/current failed (${res.status()}).`);
    return (await res.json()) as CurrentFast;
  }

  async startFast(targetHours?: number): Promise<FastSession> {
    const res = await this.request.post(`${API_URL}/api/fasting/start`, {
      headers: await this.bearer(),
      data: targetHours ? { targetHours } : {},
    });
    if (!res.ok()) throw new Error(`POST /api/fasting/start failed (${res.status()}).`);
    return (await res.json()) as FastSession;
  }

  async endFast(): Promise<FastSession> {
    const res = await this.request.post(`${API_URL}/api/fasting/current/end`, {
      headers: await this.bearer(),
    });
    if (!res.ok()) throw new Error(`POST /api/fasting/current/end failed (${res.status()}).`);
    return (await res.json()) as FastSession;
  }

  /** Ends any open fast so a spec can start from a clean state (no-op when none). */
  async ensureNoOpenFast(): Promise<void> {
    const { current } = await this.getCurrentFast();
    if (current) await this.endFast();
  }

  /** PUT /api/fasting/schedule — overrides replace the existing set wholesale. */
  async updateSchedule(req: {
    windowStart: string;
    windowEnd: string;
    targetFastHours: number;
    overrides: FastingOverride[];
  }): Promise<FastingSchedule> {
    const res = await this.request.put(`${API_URL}/api/fasting/schedule`, {
      headers: await this.bearer(),
      data: req,
    });
    if (!res.ok()) throw new Error(`PUT /api/fasting/schedule failed (${res.status()}).`);
    return (await res.json()) as FastingSchedule;
  }

  async fastingHistory(from: string, to: string): Promise<FastSession[]> {
    const res = await this.request.get(
      `${API_URL}/api/fasting/history?from=${from}&to=${to}`,
      { headers: await this.bearer() },
    );
    if (!res.ok()) throw new Error(`GET /api/fasting/history failed (${res.status()}).`);
    return (await res.json()) as FastSession[];
  }

  async listWorkouts(from: string, to: string): Promise<WorkoutRow[]> {
    const res = await this.request.get(
      `${API_URL}/api/workouts?from=${from}&to=${to}`,
      { headers: await this.bearer() },
    );
    if (!res.ok()) throw new Error(`GET /api/workouts failed (${res.status()}).`);
    return (await res.json()) as WorkoutRow[];
  }

  async deleteWorkout(id: string): Promise<void> {
    const res = await this.request.delete(`${API_URL}/api/workouts/${id}`, {
      headers: await this.bearer(),
    });
    if (!res.ok()) throw new Error(`DELETE workout ${id} failed (${res.status()}).`);
  }

  async listMeals(from: string, to: string): Promise<MealRow[]> {
    const res = await this.request.get(
      `${API_URL}/api/meals?from=${from}&to=${to}`,
      { headers: await this.bearer() },
    );
    if (!res.ok()) throw new Error(`GET /api/meals failed (${res.status()}).`);
    return (await res.json()) as MealRow[];
  }

  async listPeople(): Promise<PersonRow[]> {
    const res = await this.request.get(`${API_URL}/api/people`, {
      headers: await this.bearer(),
    });
    if (!res.ok()) throw new Error(`GET /api/people failed (${res.status()}).`);
    return (await res.json()) as PersonRow[];
  }

  async createPerson(data: {
    name: string;
    relationship?: string;
    phone?: string;
    contactCadenceDays?: number;
  }): Promise<PersonRow> {
    const res = await this.request.post(`${API_URL}/api/people`, {
      headers: await this.bearer(),
      data,
    });
    if (!res.ok()) throw new Error(`POST /api/people failed (${res.status()}).`);
    return (await res.json()) as PersonRow;
  }

  /** DELETE = archive (soft); repeat-safe teardown for test-created people. */
  async archivePerson(id: string): Promise<void> {
    const res = await this.request.delete(`${API_URL}/api/people/${id}`, {
      headers: await this.bearer(),
    });
    if (!res.ok() && res.status() !== 404) {
      throw new Error(`DELETE person ${id} failed (${res.status()}).`);
    }
  }

  /** Archives every active person — a clean slate for nudge determinism. */
  async archiveAllPeople(): Promise<void> {
    for (const person of await this.listPeople()) {
      await this.archivePerson(person.id);
    }
  }

  async recordContact(id: string): Promise<PersonRow> {
    const res = await this.request.post(`${API_URL}/api/people/${id}/contact`, {
      headers: await this.bearer(),
    });
    if (!res.ok()) throw new Error(`POST /api/people/${id}/contact failed (${res.status()}).`);
    return (await res.json()) as PersonRow;
  }

  async nudges(): Promise<NudgeRow[]> {
    const res = await this.request.get(`${API_URL}/api/people/nudges`, {
      headers: await this.bearer(),
    });
    if (!res.ok()) throw new Error(`GET /api/people/nudges failed (${res.status()}).`);
    return (await res.json()) as NudgeRow[];
  }
}

interface ShFixtures {
  pages: Pages;
  api: ShalomApi;
  signInAsSeededUser: () => Promise<void>;
  pinnedMorning: string;
  /**
   * Most specs model a RETURNING device, so `sh.onboarded` is pre-set and
   * the M7 welcome flow never intercepts them (the auth guard sends fresh
   * visitors to `/welcome`, and the first sign-in detours there too).
   * `onboarding.spec.ts` opts out via `test.use({ onboarded: false })`.
   */
  onboarded: boolean;
}

export const test = base.extend<ShFixtures>({
  onboarded: [true, { option: true }],
  // Every spec starts at a deterministic 08:00 local morning (today's real
  // date, so server-derived local days still match). Re-pin with pinClock()
  // for midday/evening/night scenarios.
  pinnedMorning: [
    async ({ page, onboarded }, use) => {
      if (onboarded) {
        await page.addInitScript(() => {
          try {
            window.localStorage.setItem('sh.onboarded', '1');
          } catch {
            // about:blank and friends — the app origin will run this again.
          }
        });
      }
      const iso = `${localIsoDate()}T08:00:00`;
      await pinClock(page, iso);
      await use(iso);
    },
    { auto: true },
  ],
  pages: async ({ page }, use) => {
    await use({
      signIn: new SignInPage(page),
      today: new TodayPage(page),
      ritual: new RitualPage(page),
      health: new HealthPage(page),
      fastDetail: new FastDetailPage(page),
      people: new PeoplePage(page),
      personDetail: new PersonDetailPage(page),
      welcome: new WelcomePage(page),
      settings: new SettingsPage(page),
    });
  },
  api: async ({ request }, use) => {
    await use(new ShalomApi(request));
  },
  signInAsSeededUser: async ({ pages }, use) => {
    await use(async () => {
      await pages.signIn.navigate();
      await pages.signIn.signIn(SEEDED_USER.email, SEEDED_USER.password);
      // The dashboard greeting only renders once GET /api/today resolves.
      await expect(pages.today.greeting).toBeVisible({ timeout: 15_000 });
    });
  },
});

export { expect };
