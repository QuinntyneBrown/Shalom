/** One day of a reading plan. `completedOn` is the local day it was read, or null. */
export interface ReadingDayDto {
  readonly id: string;
  readonly dayNumber: number;
  readonly passageReference: string;
  readonly youVersionUrl: string;
  readonly completedOn: string | null;
}
