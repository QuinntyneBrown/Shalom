/** An important date inside its lead window, surfaced on Today (`date` is `yyyy-MM-dd`). */
export interface UpcomingDateDto {
  readonly personId: string;
  readonly personName: string;
  readonly label: string;
  readonly date: string;
  readonly daysUntil: number;
}
