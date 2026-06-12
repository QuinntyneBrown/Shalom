import { Locator, Page } from '@playwright/test';

import { todayPageSelectors as S } from '../helpers/today-page.selectors';
import { BasePage } from './base.page';

/** Mood chip labels in rating order 1–5 (shared with the ritual POM). */
export type MoodLabel = 'Heavy' | 'Tense' | 'Flat' | 'Steady' | 'Full';

/**
 * Today page (`/today`) — the time-aware composition. Morning: ritual hero
 * (or morning-complete), fasting, movement intention, connection,
 * discovery. Midday: eating window. Evening: closing countdown + tomorrow
 * glance. Night: the rest state with no CTAs.
 */
export class TodayPage extends BasePage {
  readonly greeting: Locator;
  readonly date: Locator;
  readonly avatar: Locator;
  readonly statusPill: Locator;

  readonly ritualHero: Locator;
  readonly ritualBegin: Locator;
  readonly morningComplete: Locator;
  readonly stillHere: Locator;
  readonly dayBadge: Locator;

  readonly fastingCard: Locator;
  readonly fastingElapsed: Locator;
  readonly fastingWindow: Locator;

  readonly eatingWindow: Locator;
  readonly logMeal: Locator;
  readonly windowCountdown: Locator;
  readonly windowClosing: Locator;

  readonly movementCard: Locator;
  readonly eveningMovement: Locator;
  readonly movementDismiss: Locator;

  readonly connectionCard: Locator;
  readonly connectionPrompt: Locator;
  readonly connectionText: Locator;
  readonly connectionCall: Locator;
  readonly connectionDone: Locator;
  readonly connectionSnooze: Locator;
  readonly upcomingDate: Locator;

  readonly tomorrow: Locator;

  readonly discovery: Locator;
  readonly discoveryCta: Locator;
  readonly discoveryDismiss: Locator;

  readonly night: Locator;
  readonly streaks: Locator;

  constructor(page: Page) {
    super(page);
    this.greeting = page.locator(S.greeting);
    this.date = page.locator(S.date);
    this.avatar = page.locator(S.avatar);
    this.statusPill = page.locator(S.statusPill);

    this.ritualHero = page.locator(S.ritualHero);
    this.ritualBegin = page.locator(S.ritualBegin);
    this.morningComplete = page.locator(S.morningComplete);
    this.stillHere = page.locator(S.stillHere);
    this.dayBadge = page.locator(S.dayBadge);

    this.fastingCard = page.locator(S.fastingCard);
    this.fastingElapsed = page.locator(S.fastingElapsed);
    this.fastingWindow = page.locator(S.fastingWindow);

    this.eatingWindow = page.locator(S.eatingWindow);
    this.logMeal = page.locator(S.logMeal);
    this.windowCountdown = page.locator(S.windowCountdown);
    this.windowClosing = page.locator(S.windowClosing);

    this.movementCard = page.locator(S.movementCard);
    this.eveningMovement = page.locator(S.eveningMovement);
    this.movementDismiss = page.locator(S.movementDismiss);

    this.connectionCard = page.locator(S.connectionCard);
    this.connectionPrompt = page.locator(S.connectionPrompt);
    this.connectionText = page.locator(S.connectionText);
    this.connectionCall = page.locator(S.connectionCall);
    this.connectionDone = page.locator(S.connectionDone);
    this.connectionSnooze = page.locator(S.connectionSnooze);
    this.upcomingDate = page.locator(S.upcomingDate);

    this.tomorrow = page.locator(S.tomorrow);

    this.discovery = page.locator(S.discovery);
    this.discoveryCta = page.locator(S.discoveryCta);
    this.discoveryDismiss = page.locator(S.discoveryDismiss);

    this.night = page.locator(S.night);
    this.streaks = page.locator(S.streaks);
  }

  async navigate(): Promise<void> {
    await this.page.goto('/today');
  }

  /** Morning movement-intention chip by equipment value. */
  intentionChip(value: 'Treadmill' | 'IndoorBike' | 'Elliptical' | 'Rest'): Locator {
    return this.page.locator(`${S.intentionChipPrefix}${value}"]`);
  }

  /** Begins the morning ritual from the hero (or the gentle still-here card). */
  async beginRitual(): Promise<void> {
    await this.ritualBegin.click();
  }
}
