import { Locator, Page } from '@playwright/test';

import { healthPageSelectors as S } from '../helpers/health-page.selectors';
import { BasePage } from './base.page';

export type MachineLabel = 'Treadmill' | 'Bike' | 'Elliptical' | 'Outdoor walk' | 'Outdoor run';

/**
 * Health page (`/health`) — fasting summary card with the live ring,
 * this-week strip, workout quick-log chips (each opens the workout bottom
 * sheet), recent workouts, and the meals card.
 */
export class HealthPage extends BasePage {
  readonly heading: Locator;
  readonly statusPill: Locator;

  readonly fastingCard: Locator;
  readonly fastingRing: Locator;
  readonly fastingElapsed: Locator;
  readonly fastingWindow: Locator;
  readonly fastingTarget: Locator;
  readonly detailLink: Locator;

  readonly weekCard: Locator;
  readonly weekDots: Locator;

  readonly workoutsCard: Locator;
  readonly workoutAdd: Locator;
  readonly recentWorkouts: Locator;
  readonly recentWorkoutRows: Locator;

  readonly mealsCard: Locator;
  readonly lastMeal: Locator;
  readonly logMealButton: Locator;

  // Workout sheet (renders in the CDK overlay container).
  readonly sheetDuration: Locator;
  readonly sheetDurationMinus: Locator;
  readonly sheetDurationPlus: Locator;
  readonly sheetSaveWorkout: Locator;

  // Meal sheet.
  readonly sheetMealText: Locator;
  readonly sheetSaveMeal: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator(S.heading);
    this.statusPill = page.locator(S.statusPill);

    this.fastingCard = page.locator(S.fastingCard);
    this.fastingRing = page.locator(S.fastingRing);
    this.fastingElapsed = page.locator(S.fastingElapsed);
    this.fastingWindow = page.locator(S.fastingWindow);
    this.fastingTarget = page.locator(S.fastingTarget);
    this.detailLink = page.locator(S.detailLink);

    this.weekCard = page.locator(S.weekCard);
    this.weekDots = page.locator(S.weekDots);

    this.workoutsCard = page.locator(S.workoutsCard);
    this.workoutAdd = page.locator(S.workoutAdd);
    this.recentWorkouts = page.locator(S.recentWorkouts);
    this.recentWorkoutRows = page.locator(S.recentWorkoutRows);

    this.mealsCard = page.locator(S.mealsCard);
    this.lastMeal = page.locator(S.lastMeal);
    this.logMealButton = page.locator(S.logMealButton);

    this.sheetDuration = page.locator(S.sheetDuration);
    this.sheetDurationMinus = page.locator(S.sheetDurationMinus);
    this.sheetDurationPlus = page.locator(S.sheetDurationPlus);
    this.sheetSaveWorkout = page.locator(S.sheetSaveWorkout);

    this.sheetMealText = page.locator(S.sheetMealText);
    this.sheetSaveMeal = page.locator(S.sheetSaveMeal);
  }

  async navigate(): Promise<void> {
    await this.page.goto('/health');
  }

  /** Quick-log chip on the Workouts card. */
  workoutChip(machine: MachineLabel): Locator {
    const selector = {
      Treadmill: S.workoutChipTreadmill,
      Bike: S.workoutChipBike,
      Elliptical: S.workoutChipElliptical,
      'Outdoor walk': S.workoutChipOutdoorWalk,
      'Outdoor run': S.workoutChipOutdoorRun,
    }[machine];
    return this.page.locator(selector);
  }

  /** Machine chip inside the workout sheet. */
  sheetMachineChip(machine: MachineLabel): Locator {
    const selector = {
      Treadmill: S.sheetMachineTreadmill,
      Bike: S.sheetMachineBike,
      Elliptical: S.sheetMachineElliptical,
      'Outdoor walk': S.sheetMachineOutdoorWalk,
      'Outdoor run': S.sheetMachineOutdoorRun,
    }[machine];
    return this.page.locator(selector);
  }

  /** Effort chip inside the workout sheet. */
  sheetEffortChip(effort: 'easy' | 'steady' | 'strong'): Locator {
    const selector = {
      easy: S.sheetEffortEasy,
      steady: S.sheetEffortSteady,
      strong: S.sheetEffortStrong,
    }[effort];
    return this.page.locator(selector);
  }

  /** Tag chip inside the meal sheet. */
  sheetMealTag(tag: string): Locator {
    return this.page.locator(S.sheetMealTag(tag));
  }
}
