/**
 * Selectors for the HealthPage component (and the workout/meal bottom
 * sheets it opens — those render inside the CDK overlay container, so the
 * selectors are page-global).
 *
 * Follows the today-page.selectors.ts style: stable `data-testid` hooks
 * (kebab-case, sh-prefixed) owned by the implementation.
 */
export const healthPageSelectors = {
  /** "Health" page heading */
  heading: 'h1:has-text("Health")',
  /** Header status pill ("Fasting · 11h 24m" / "Eating window") */
  statusPill: '[data-testid="sh-health-status-pill"]',

  /** Fasting summary card */
  fastingCard: '[data-testid="sh-fasting-card"]',
  fastingRing: '[data-testid="sh-fasting-ring"]',
  fastingElapsed: '[data-testid="sh-fasting-elapsed"]',
  fastingWindow: '[data-testid="sh-fasting-window"]',
  fastingTarget: '[data-testid="sh-fasting-target"]',
  detailLink: '[data-testid="sh-fasting-detail-link"]',

  /** This-week strip card */
  weekCard: '[data-testid="sh-week-card"]',
  weekDots: '[data-testid="sh-week-card"] .days .dot',

  /** Workouts card */
  workoutsCard: '[data-testid="sh-workouts-card"]',
  workoutChipTreadmill: '[data-testid="sh-workout-chip-treadmill"]',
  workoutChipBike: '[data-testid="sh-workout-chip-indoorbike"]',
  workoutChipElliptical: '[data-testid="sh-workout-chip-elliptical"]',
  workoutChipOutdoorWalk: '[data-testid="sh-workout-chip-outdoorwalk"]',
  workoutChipOutdoorRun: '[data-testid="sh-workout-chip-outdoorrun"]',
  workoutAdd: '[data-testid="sh-workout-add"]',
  recentWorkouts: '[data-testid="sh-recent-workouts"]',
  recentWorkoutRows: '[data-testid="sh-recent-workouts"] sh-stat-row',

  /** Meals card */
  mealsCard: '[data-testid="sh-meals-card"]',
  lastMeal: '[data-testid="sh-last-meal"]',
  logMealButton: '[data-testid="sh-log-meal"]',

  /** Workout bottom sheet (CDK overlay) */
  sheetMachineBike: '[data-testid="sh-sheet-machine-indoorbike"]',
  sheetMachineTreadmill: '[data-testid="sh-sheet-machine-treadmill"]',
  sheetMachineElliptical: '[data-testid="sh-sheet-machine-elliptical"]',
  sheetMachineOutdoorWalk: '[data-testid="sh-sheet-machine-outdoorwalk"]',
  sheetMachineOutdoorRun: '[data-testid="sh-sheet-machine-outdoorrun"]',
  sheetDuration: '[data-testid="sh-sheet-duration"]',
  sheetDurationMinus: '[data-testid="sh-sheet-duration-minus"]',
  sheetDurationPlus: '[data-testid="sh-sheet-duration-plus"]',
  sheetEffortEasy: '[data-testid="sh-sheet-effort-easy"]',
  sheetEffortSteady: '[data-testid="sh-sheet-effort-steady"]',
  sheetEffortStrong: '[data-testid="sh-sheet-effort-strong"]',
  sheetSaveWorkout: '[data-testid="sh-sheet-save-workout"]',

  /** Meal bottom sheet (CDK overlay) */
  sheetMealText: '[data-testid="sh-sheet-meal-text"]',
  sheetMealTag: (tag: string) => `[data-testid="sh-sheet-meal-tag-${tag}"]`,
  sheetSaveMeal: '[data-testid="sh-sheet-save-meal"]',
} as const;
