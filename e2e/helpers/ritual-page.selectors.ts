/**
 * Selectors for the RitualPage component (`/today/ritual`). Hand-written in
 * the ppg-curated style: stable `data-testid` hooks owned by the
 * implementation, plus the `sh-*` component selectors for the shared
 * chips/dots atoms.
 */
export const ritualPageSelectors = {
  /** Chrome */
  close: '[data-testid="sh-ritual-close"]',
  dots: '[data-testid="sh-ritual-dots"] .dot',
  doneDots: '[data-testid="sh-ritual-dots"] .dot.done',

  /** Step 1 — check-in */
  stepCheckIn: '[data-testid="sh-ritual-step-checkin"]',
  moodChips: '[data-testid="sh-ritual-step-checkin"] sh-rating-chips button.chip',
  closenessDots: '[data-testid="sh-ritual-step-checkin"] sh-dot-scale button.dot',
  noteInput: '[data-testid="sh-ritual-note"]',
  continueButton: '[data-testid="sh-ritual-continue"]',

  /** Step 2 — scripture */
  stepScripture: '[data-testid="sh-ritual-step-scripture"]',
  verseText: '[data-testid="sh-ritual-verse-text"]',
  verseReference: '[data-testid="sh-ritual-verse-ref"]',
  readingPassage: '[data-testid="sh-ritual-reading-passage"]',
  youVersionLink: '[data-testid="sh-ritual-youversion"]',
  markReadButton: '[data-testid="sh-ritual-mark-read"]',

  /** Step 3 — prayer */
  stepPrayer: '[data-testid="sh-ritual-step-prayer"]',
  focusName: '[data-testid="sh-ritual-focus-name"]',
  focusLine: '[data-testid="sh-ritual-focus-line"]',
  amenButton: '[data-testid="sh-ritual-amen"]',

  /** Step 4 — day preview */
  stepPreview: '[data-testid="sh-ritual-step-preview"]',
  previewWindow: '[data-testid="sh-ritual-preview-window"]',
  previewMovement: '[data-testid="sh-ritual-preview-movement"]',
  previewConnection: '[data-testid="sh-ritual-preview-connection"]',
  /** Append the equipment value, e.g. `sh-ritual-intention-IndoorBike`. */
  intentionChipPrefix: '[data-testid="sh-ritual-intention-',
  doneButton: '[data-testid="sh-ritual-done"]',

  /** Completion */
  complete: '[data-testid="sh-ritual-complete"]',
  dayBadge: '[data-testid="sh-ritual-day-badge"]',
} as const;
