import { ReadingDayDto } from './reading-day-dto';

/** The active reading plan with every day and its completion state. */
export interface ReadingPlanDto {
  readonly id: string;
  readonly name: string;
  readonly startDate: string;
  readonly isActive: boolean;
  readonly completedCount: number;
  readonly totalDays: number;
  readonly days: readonly ReadingDayDto[];
}
