/**
 * Selectors for the WelcomePage component (M7 onboarding, designs 16–18).
 * Hand-written against the stable `sh-welcome-*` data-testid hooks the
 * implementation owns (same convention the ppg-generated maps were
 * refined to).
 */
export const welcomePageSelectors = {
  /** Step sections (one visible at a time) */
  step1: '[data-testid="sh-welcome-step-1"]',
  step2: '[data-testid="sh-welcome-step-2"]',
  step3: '[data-testid="sh-welcome-step-3"]',

  /** Page dots */
  dots: '[data-testid="sh-welcome-dots"]',

  /** Step 2 — rhythm cards */
  wakeCard: '[data-testid="sh-welcome-wake"]',
  wakeValue: '[data-testid="sh-welcome-wake-value"]',
  wakeChange: '[data-testid="sh-welcome-wake-change"]',
  windowCard: '[data-testid="sh-welcome-window"]',
  windowValue: '[data-testid="sh-welcome-window-value"]',
  windowChange: '[data-testid="sh-welcome-window-change"]',
  sundayToggle: '[data-testid="sh-welcome-sunday-toggle"]',

  /** Step 3 — make it yours */
  a2hsCard: '[data-testid="sh-welcome-a2hs"]',
  installed: '[data-testid="sh-welcome-installed"]',
  shortcutsCard: '[data-testid="sh-welcome-shortcuts"]',
  shortcutsHow: '[data-testid="sh-welcome-shortcuts-how"]',
  shortcutsNote: '[data-testid="sh-welcome-shortcuts-note"]',

  /** CTAs */
  continueButton: '[data-testid="sh-welcome-continue"]',
  finishButton: '[data-testid="sh-welcome-finish"]',
  startNowButton: '[data-testid="sh-welcome-start-now"]',

  /** Wake-time sheet (CDK bottom sheet) */
  sheetWakeTime: '[data-testid="sh-sheet-wake-time"]',
  sheetSaveWakeTime: '[data-testid="sh-sheet-save-wake-time"]',

  /** Eating-window sheet (CDK bottom sheet) */
  sheetWindowStart: '[data-testid="sh-sheet-window-start"]',
  sheetWindowEnd: '[data-testid="sh-sheet-window-end"]',
  sheetSaveWindow: '[data-testid="sh-sheet-save-window"]',
} as const;
