import { Locator, Page } from '@playwright/test';

import { welcomePageSelectors as S } from '../helpers/welcome-page.selectors';
import { BasePage } from './base.page';

/**
 * Welcome / onboarding flow (`/welcome`, designs 16–18). Three steps:
 * the promise, the rhythm (wake time + eating window), make-it-yours
 * (Add to Home Screen + Shortcuts). No auth guard — it runs before the
 * first sign-in and as the post-sign-in quick setup (steps 2–3).
 */
export class WelcomePage extends BasePage {
  readonly step1: Locator;
  readonly step2: Locator;
  readonly step3: Locator;
  readonly dots: Locator;

  readonly wakeCard: Locator;
  readonly wakeValue: Locator;
  readonly wakeChange: Locator;
  readonly windowCard: Locator;
  readonly windowValue: Locator;
  readonly windowChange: Locator;
  readonly sundayToggle: Locator;

  readonly a2hsCard: Locator;
  readonly installed: Locator;
  readonly shortcutsCard: Locator;
  readonly shortcutsHow: Locator;
  readonly shortcutsNote: Locator;

  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly startNowButton: Locator;

  readonly sheetWakeTime: Locator;
  readonly sheetSaveWakeTime: Locator;

  constructor(page: Page) {
    super(page);
    this.step1 = page.locator(S.step1);
    this.step2 = page.locator(S.step2);
    this.step3 = page.locator(S.step3);
    this.dots = page.locator(S.dots);

    this.wakeCard = page.locator(S.wakeCard);
    this.wakeValue = page.locator(S.wakeValue);
    this.wakeChange = page.locator(S.wakeChange);
    this.windowCard = page.locator(S.windowCard);
    this.windowValue = page.locator(S.windowValue);
    this.windowChange = page.locator(S.windowChange);
    this.sundayToggle = page.locator(S.sundayToggle);

    this.a2hsCard = page.locator(S.a2hsCard);
    this.installed = page.locator(S.installed);
    this.shortcutsCard = page.locator(S.shortcutsCard);
    this.shortcutsHow = page.locator(S.shortcutsHow);
    this.shortcutsNote = page.locator(S.shortcutsNote);

    this.continueButton = page.locator(S.continueButton);
    this.finishButton = page.locator(S.finishButton);
    this.startNowButton = page.locator(S.startNowButton);

    this.sheetWakeTime = page.locator(S.sheetWakeTime);
    this.sheetSaveWakeTime = page.locator(S.sheetSaveWakeTime);
  }

  async navigate(): Promise<void> {
    await this.page.goto('/welcome');
  }

  /** Sets the wake time through the bottom sheet ("HH:mm", 24h). */
  async setWakeTime(hhmm: string): Promise<void> {
    await this.wakeChange.click();
    await this.sheetWakeTime.fill(hhmm);
    await this.sheetSaveWakeTime.click();
  }
}
