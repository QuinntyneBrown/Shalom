/**
 * Selectors for the SettingsPage component (+ the fasting-schedule bottom
 * sheet it opens, which renders in the CDK overlay container).
 *
 * Curated from `ppg workspace ./frontend` output during the M8
 * reconciliation pass: the stable `data-testid` hooks were adopted; the
 * generated catch-all locators (`button`, `span:has-text(...)`) were
 * discarded.
 */
export const settingsPageSelectors = {
  heading: 'h1:has-text("Settings")',

  /** RHYTHM group */
  wakeRow: '[data-testid="sh-settings-wake"]',
  fastingRow: '[data-testid="sh-settings-fasting"]',
  quietDaysRow: '[data-testid="sh-settings-quiet-days"]',

  /** FAITH group */
  readingPlanRow: '[data-testid="sh-settings-reading-plan"]',

  /** APPEARANCE — append the preference, e.g. `sh-settings-theme-dawn"]`. */
  themeChipPrefix: '[data-testid="sh-settings-theme-',

  /** SHALOM group */
  everythingRow: '[data-testid="sh-settings-everything"]',
  replayWelcomeRow: '[data-testid="sh-settings-replay-welcome"]',

  signOut: '[data-testid="sh-settings-sign-out"]',

  /** Fasting-schedule sheet (CDK overlay) */
  sheetScheduleStart: '[data-testid="sh-sheet-schedule-start"]',
  sheetScheduleEnd: '[data-testid="sh-sheet-schedule-end"]',
  sheetScheduleTarget: '[data-testid="sh-sheet-schedule-target"]',
  sheetScheduleTargetMinus: '[data-testid="sh-sheet-schedule-target-minus"]',
  sheetScheduleTargetPlus: '[data-testid="sh-sheet-schedule-target-plus"]',
  sheetScheduleSundayToggle: '[data-testid="sh-sheet-schedule-sunday-toggle"]',
  sheetScheduleSundayStart: '[data-testid="sh-sheet-schedule-sunday-start"]',
  sheetScheduleSundayEnd: '[data-testid="sh-sheet-schedule-sunday-end"]',
  sheetSaveSchedule: '[data-testid="sh-sheet-save-schedule"]',
} as const;
