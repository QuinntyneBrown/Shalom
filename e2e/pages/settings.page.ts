import { Locator, Page } from '@playwright/test';

import { settingsPageSelectors as S } from '../helpers/settings-page.selectors';
import { BasePage } from './base.page';

/**
 * Settings page (`/settings`, design 19) — grouped rows. The fasting row
 * opens the schedule editor bottom sheet (CDK overlay), whose locators
 * live here too (precedent: the person-detail POM owns its sheets).
 */
export class SettingsPage extends BasePage {
  readonly heading: Locator;

  readonly wakeRow: Locator;
  readonly fastingRow: Locator;
  readonly quietDaysRow: Locator;
  readonly readingPlanRow: Locator;
  readonly nudgesRow: Locator;
  readonly everythingRow: Locator;
  readonly replayWelcomeRow: Locator;
  readonly signOut: Locator;

  // Reminders sheet (M10, CDK overlay).
  readonly sheetRemindersCopy: Locator;
  readonly sheetRemindersStatus: Locator;
  readonly sheetRemindersEnable: Locator;
  readonly sheetRemindersDisable: Locator;
  readonly sheetRemindersClose: Locator;

  // Fasting-schedule sheet (renders in the CDK overlay container).
  readonly sheetScheduleStart: Locator;
  readonly sheetScheduleEnd: Locator;
  readonly sheetScheduleTarget: Locator;
  readonly sheetScheduleTargetMinus: Locator;
  readonly sheetScheduleTargetPlus: Locator;
  readonly sheetScheduleSundayToggle: Locator;
  readonly sheetScheduleSundayStart: Locator;
  readonly sheetScheduleSundayEnd: Locator;
  readonly sheetSaveSchedule: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator(S.heading);

    this.wakeRow = page.locator(S.wakeRow);
    this.fastingRow = page.locator(S.fastingRow);
    this.quietDaysRow = page.locator(S.quietDaysRow);
    this.readingPlanRow = page.locator(S.readingPlanRow);
    this.nudgesRow = page.locator(S.nudgesRow);
    this.everythingRow = page.locator(S.everythingRow);
    this.replayWelcomeRow = page.locator(S.replayWelcomeRow);
    this.signOut = page.locator(S.signOut);

    this.sheetRemindersCopy = page.locator(S.sheetRemindersCopy);
    this.sheetRemindersStatus = page.locator(S.sheetRemindersStatus);
    this.sheetRemindersEnable = page.locator(S.sheetRemindersEnable);
    this.sheetRemindersDisable = page.locator(S.sheetRemindersDisable);
    this.sheetRemindersClose = page.locator(S.sheetRemindersClose);

    this.sheetScheduleStart = page.locator(S.sheetScheduleStart);
    this.sheetScheduleEnd = page.locator(S.sheetScheduleEnd);
    this.sheetScheduleTarget = page.locator(S.sheetScheduleTarget);
    this.sheetScheduleTargetMinus = page.locator(S.sheetScheduleTargetMinus);
    this.sheetScheduleTargetPlus = page.locator(S.sheetScheduleTargetPlus);
    this.sheetScheduleSundayToggle = page.locator(S.sheetScheduleSundayToggle);
    this.sheetScheduleSundayStart = page.locator(S.sheetScheduleSundayStart);
    this.sheetScheduleSundayEnd = page.locator(S.sheetScheduleSundayEnd);
    this.sheetSaveSchedule = page.locator(S.sheetSaveSchedule);
  }

  async navigate(): Promise<void> {
    await this.page.goto('/settings');
  }

  /** Theme chip by preference value (`auto` | `light` | `dawn`). */
  themeChip(preference: 'auto' | 'light' | 'dawn'): Locator {
    return this.page.locator(`${S.themeChipPrefix}${preference}"]`);
  }
}
