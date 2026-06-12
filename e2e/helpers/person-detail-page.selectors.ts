/**
 * Selectors for the PersonDetailPage component (and the date/gratitude
 * bottom sheets it opens — those render inside the CDK overlay container,
 * so the selectors are page-global).
 */
export const personDetailPageSelectors = {
  /** Top bar */
  back: '[data-testid="sh-detail-back"]',
  edit: '[data-testid="sh-detail-edit"]',

  /** Identity block */
  name: '[data-testid="sh-detail-name"]',
  relationship: '[data-testid="sh-detail-relationship"]',
  lastContact: '[data-testid="sh-detail-last-contact"]',

  /** Quick actions */
  text: '[data-testid="sh-detail-text"]',
  call: '[data-testid="sh-detail-call"]',
  connected: '[data-testid="sh-detail-connected"]',

  /** Important dates card */
  datesCard: '[data-testid="sh-dates-card"]',
  dateRow: '[data-testid="sh-date-row"]',
  dateWhen: '[data-testid="sh-date-when"]',
  dateRemove: '[data-testid="sh-date-remove"]',
  addDate: '[data-testid="sh-detail-add-date"]',

  /** Gratitude card */
  gratitudeCard: '[data-testid="sh-gratitude-card"]',
  gratitudeEntry: '[data-testid="sh-gratitude-entry"]',
  addNote: '[data-testid="sh-detail-add-note"]',

  /** "Add a date" bottom sheet (CDK overlay) */
  sheetDateLabel: '[data-testid="sh-sheet-date-label"]',
  sheetDateMonth: '[data-testid="sh-sheet-date-month"]',
  sheetDateDay: '[data-testid="sh-sheet-date-day"]',
  sheetDateYear: '[data-testid="sh-sheet-date-year"]',
  sheetSaveDate: '[data-testid="sh-sheet-save-date"]',

  /** Gratitude bottom sheet (CDK overlay) */
  sheetGratitudeText: '[data-testid="sh-sheet-gratitude-text"]',
  sheetSaveGratitude: '[data-testid="sh-sheet-save-gratitude"]',
} as const;
