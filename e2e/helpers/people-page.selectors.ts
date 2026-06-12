/**
 * Selectors for the PeoplePage component (and the add/edit person bottom
 * sheet it opens — the sheet renders inside the CDK overlay container, so
 * those selectors are page-global).
 *
 * Follows the health-page.selectors.ts style: stable `data-testid` hooks
 * (kebab-case, sh-prefixed) owned by the implementation.
 */
export const peoplePageSelectors = {
  /** "People" page heading + tagline */
  heading: 'h1:has-text("People")',
  tagline: '.page-head .tagline',

  /** Today's-nudge card */
  nudgeCard: '[data-testid="sh-nudge-card"]',
  nudgePrompt: '[data-testid="sh-nudge-prompt"]',
  nudgeText: '[data-testid="sh-nudge-text"]',
  nudgeCall: '[data-testid="sh-nudge-call"]',
  nudgeDone: '[data-testid="sh-nudge-done"]',
  nudgeSnooze: '[data-testid="sh-nudge-snooze"]',

  /** People list card */
  peopleList: '[data-testid="sh-people-list"]',
  personRow: '[data-testid="sh-person-row"]',
  personName: '[data-testid="sh-person-row"] .name',
  personCaption: '[data-testid="sh-person-row"] .caption',
  connectedDot: '[data-testid="sh-person-connected-dot"]',
  addPerson: '[data-testid="sh-add-person"]',

  /** Add/edit person bottom sheet (CDK overlay) */
  sheetPersonName: '[data-testid="sh-sheet-person-name"]',
  sheetPersonRelationship: '[data-testid="sh-sheet-person-relationship"]',
  sheetPersonPhone: '[data-testid="sh-sheet-person-phone"]',
  sheetPersonCadence: '[data-testid="sh-sheet-person-cadence"]',
  sheetSavePerson: '[data-testid="sh-sheet-save-person"]',
} as const;
