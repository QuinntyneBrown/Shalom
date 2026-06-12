/** Verse of the day (World English Bible text + YouVersion deep link). */
export interface VerseDto {
  readonly reference: string;
  readonly text: string;
  readonly youVersionUrl: string;
}
