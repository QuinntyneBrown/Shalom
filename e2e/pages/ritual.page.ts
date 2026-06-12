import { Locator, Page } from '@playwright/test';

import { ritualPageSelectors as S } from '../helpers/ritual-page.selectors';
import { MoodLabel } from './today.page';
import { BasePage } from './base.page';

/** Movement intention values as rendered on step 4 chips. */
export type IntentionValue = 'Treadmill' | 'IndoorBike' | 'Elliptical' | 'Rest';

/**
 * Morning ritual (`/today/ritual`) — the full-screen 4-step flow:
 * check-in → scripture → prayer → day preview → "Shalom." completion.
 */
export class RitualPage extends BasePage {
  readonly close: Locator;
  readonly stepDots: Locator;
  readonly doneDots: Locator;

  readonly stepCheckIn: Locator;
  readonly noteInput: Locator;
  readonly continueButton: Locator;

  readonly stepScripture: Locator;
  readonly verseText: Locator;
  readonly verseReference: Locator;
  readonly readingPassage: Locator;
  readonly youVersionLink: Locator;
  readonly markReadButton: Locator;

  readonly stepPrayer: Locator;
  readonly focusName: Locator;
  readonly focusLine: Locator;
  readonly amenButton: Locator;

  readonly stepPreview: Locator;
  readonly previewWindow: Locator;
  readonly previewMovement: Locator;
  readonly previewConnection: Locator;
  readonly doneButton: Locator;

  readonly complete: Locator;
  readonly dayBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.close = page.locator(S.close);
    this.stepDots = page.locator(S.dots);
    this.doneDots = page.locator(S.doneDots);

    this.stepCheckIn = page.locator(S.stepCheckIn);
    this.noteInput = page.locator(S.noteInput);
    this.continueButton = page.locator(S.continueButton);

    this.stepScripture = page.locator(S.stepScripture);
    this.verseText = page.locator(S.verseText);
    this.verseReference = page.locator(S.verseReference);
    this.readingPassage = page.locator(S.readingPassage);
    this.youVersionLink = page.locator(S.youVersionLink);
    this.markReadButton = page.locator(S.markReadButton);

    this.stepPrayer = page.locator(S.stepPrayer);
    this.focusName = page.locator(S.focusName);
    this.focusLine = page.locator(S.focusLine);
    this.amenButton = page.locator(S.amenButton);

    this.stepPreview = page.locator(S.stepPreview);
    this.previewWindow = page.locator(S.previewWindow);
    this.previewMovement = page.locator(S.previewMovement);
    this.previewConnection = page.locator(S.previewConnection);
    this.doneButton = page.locator(S.doneButton);

    this.complete = page.locator(S.complete);
    this.dayBadge = page.locator(S.dayBadge);
  }

  async navigate(): Promise<void> {
    await this.page.goto('/today/ritual');
  }

  /** Mood chip on step 1 by its label. */
  moodChip(label: MoodLabel): Locator {
    return this.page
      .locator(S.moodChips)
      .filter({ hasText: new RegExp(`^${label}$`) });
  }

  /** Closeness dot on step 1 by 1-based step (1 = Far … 4 = Near). */
  closenessDot(step: 1 | 2 | 3 | 4): Locator {
    return this.page.locator(S.closenessDots).nth(step - 1);
  }

  /** Movement intention chip on step 4. */
  intentionChip(value: IntentionValue): Locator {
    return this.page.locator(`${S.intentionChipPrefix}${value}"]`);
  }

  /** Step 1 in one move: mood + closeness (+ optional note), then Continue. */
  async completeCheckIn(mood: MoodLabel, dot: 1 | 2 | 3 | 4, note?: string): Promise<void> {
    await this.moodChip(mood).click();
    await this.closenessDot(dot).click();
    if (note !== undefined) await this.noteInput.fill(note);
    await this.continueButton.click();
  }
}
