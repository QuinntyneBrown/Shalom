import { Locator, Page } from '@playwright/test';

import { todayPageSelectors as S } from '../helpers/today-page.selectors';
import { BasePage } from './base.page';

/** Mood chip labels in rating order 1–5. */
export type MoodLabel = 'Heavy' | 'Tense' | 'Flat' | 'Steady' | 'Full';

/**
 * Today page (`/today`) — greeting, verse card, compact check-in card
 * (mood chips + closeness dots + note), reading card, streak line.
 */
export class TodayPage extends BasePage {
  readonly greeting: Locator;
  readonly date: Locator;

  readonly verseCard: Locator;
  readonly verseText: Locator;
  readonly verseReference: Locator;
  readonly verseLink: Locator;

  readonly checkInSection: Locator;
  readonly noteInput: Locator;
  readonly saveButton: Locator;
  readonly savedBadge: Locator;

  readonly readingCard: Locator;
  readonly readingPlanName: Locator;
  readonly readingPassage: Locator;
  readonly readingProgress: Locator;
  readonly readingLink: Locator;
  readonly markReadButton: Locator;
  readonly readingDone: Locator;

  readonly connectionCard: Locator;
  readonly connectionPrompt: Locator;
  readonly connectionText: Locator;
  readonly connectionDone: Locator;
  readonly connectionSnooze: Locator;
  readonly upcomingDate: Locator;

  readonly streaks: Locator;

  constructor(page: Page) {
    super(page);
    this.greeting = page.locator(S.greeting);
    this.date = page.locator(S.date);

    this.verseCard = page.locator(S.verseCard);
    this.verseText = page.locator(S.verseText);
    this.verseReference = page.locator(S.verseReference);
    this.verseLink = page.locator(S.verseLink);

    this.checkInSection = page.locator(S.checkInSection);
    this.noteInput = page.locator(S.noteInput);
    this.saveButton = page.locator(S.saveButton);
    this.savedBadge = page.locator(S.savedBadge);

    this.readingCard = page.locator(S.readingCard);
    this.readingPlanName = page.locator(S.readingPlanName);
    this.readingPassage = page.locator(S.readingPassage);
    this.readingProgress = page.locator(S.readingProgress);
    this.readingLink = page.locator(S.readingLink);
    this.markReadButton = page.locator(S.markReadButton);
    this.readingDone = page.locator(S.readingDone);

    this.connectionCard = page.locator(S.connectionCard);
    this.connectionPrompt = page.locator(S.connectionPrompt);
    this.connectionText = page.locator(S.connectionText);
    this.connectionDone = page.locator(S.connectionDone);
    this.connectionSnooze = page.locator(S.connectionSnooze);
    this.upcomingDate = page.locator(S.upcomingDate);

    this.streaks = page.locator(S.streaks);
  }

  async navigate(): Promise<void> {
    await this.page.goto('/today');
  }

  /** Mood chip by its label (Heavy / Tense / Flat / Steady / Full). */
  moodChip(label: MoodLabel): Locator {
    return this.page
      .locator(S.ratingChips)
      .filter({ hasText: new RegExp(`^${label}$`) });
  }

  /** Closeness dot by 1-based step (1 = Far … 4 = Near). */
  dot(step: 1 | 2 | 3 | 4): Locator {
    return this.page.locator(S.dots).nth(step - 1);
  }

  async selectMood(label: MoodLabel): Promise<void> {
    await this.moodChip(label).click();
  }

  async selectDot(step: 1 | 2 | 3 | 4): Promise<void> {
    await this.dot(step).click();
  }

  async saveCheckIn(): Promise<void> {
    await this.saveButton.click();
  }

  /** Parses "3 of 28 read" into the completed count. */
  async completedCount(): Promise<number> {
    const text = (await this.readingProgress.textContent()) ?? '';
    const match = text.match(/(\d+) of \d+ read/);
    if (!match) throw new Error(`Unexpected reading progress text: "${text}"`);
    return Number(match[1]);
  }
}
