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

import { SignInPage } from '../pages/sign-in.page';
import { TodayPage } from '../pages/today.page';
import { SEEDED_USER } from './users';

export const API_URL = 'http://localhost:5100';

interface Pages {
  signIn: SignInPage;
  today: TodayPage;
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
