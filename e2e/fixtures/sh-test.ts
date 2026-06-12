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

import { APIRequestContext, expect, test as base } from '@playwright/test';

import { FastDetailPage } from '../pages/fast-detail.page';
import { HealthPage } from '../pages/health.page';
import { SignInPage } from '../pages/sign-in.page';
import { TodayPage } from '../pages/today.page';
import { SEEDED_USER } from './users';

export const API_URL = 'http://localhost:5100';

interface Pages {
  signIn: SignInPage;
  today: TodayPage;
  health: HealthPage;
  fastDetail: FastDetailPage;
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

export interface TodayAggregate {
  date: string;
  greetingName: string;
  checkIn: unknown | null;
  reading: TodayReading | null;
}

export interface FastSession {
  id: string;
  startedAt: string;
  targetHours: number;
  endedAt: string | null;
  elapsedHours: number;
  outcome: 'Completed' | 'EndedEarly' | null;
}

export interface CurrentFast {
  current: FastSession | null;
  schedule: {
    eatingWindowStart: string;
    eatingWindowEnd: string;
    targetFastHours: number;
    timeZoneId: string;
    todayWindow: { start: string; end: string };
  };
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
}

interface ShFixtures {
  pages: Pages;
  api: ShalomApi;
  signInAsSeededUser: () => Promise<void>;
}

export const test = base.extend<ShFixtures>({
  pages: async ({ page }, use) => {
    await use({
      signIn: new SignInPage(page),
      today: new TodayPage(page),
      health: new HealthPage(page),
      fastDetail: new FastDetailPage(page),
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
