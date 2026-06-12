/**
 * Selectors for the FastDetailPage component (`/health/fasting`) and the
 * end-fast confirmation sheet (CDK overlay).
 *
 * Follows the today-page.selectors.ts style: stable `data-testid` hooks
 * (kebab-case, sh-prefixed) owned by the implementation.
 */
export const fastDetailPageSelectors = {
  /** Back arrow to /health */
  back: '[data-testid="sh-fast-back"]',
  /** "Fasting" page heading */
  heading: 'h1:has-text("Fasting")',

  /** Hero ring */
  ring: '[data-testid="sh-fast-ring"]',
  elapsed: '[data-testid="sh-fast-elapsed"]',
  /** Quiet "No fast running" state inside the ring */
  none: '[data-testid="sh-fast-none"]',
  started: '[data-testid="sh-fast-started"]',
  window: '[data-testid="sh-fast-window"]',
  endButton: '[data-testid="sh-fast-end"]',

  /** Schedule card */
  scheduleCard: '[data-testid="sh-fast-schedule"]',
  scheduleDefault: '[data-testid="sh-schedule-default"]',
  scheduleSunday: '[data-testid="sh-schedule-sunday"]',

  /** End-fast confirmation sheet (CDK overlay) */
  confirmAccept: '[data-testid="sh-confirm-accept"]',
  confirmCancel: '[data-testid="sh-confirm-cancel"]',
} as const;
