import { CheckInDto } from './check-in-dto';
import { TodayReadingDto } from './today-reading-dto';
import { TodayStreaksDto } from './today-streaks-dto';
import { VerseDto } from './verse-dto';

/**
 * The aggregate behind `GET /api/today` — one round trip for the whole
 * dashboard. Each pillar nests its own object so later pillars (fasting,
 * workout, people) arrive as new nullable properties without breaking this
 * shape.
 */
export interface TodayDto {
  readonly date: string;
  readonly greetingName: string;
  readonly checkIn: CheckInDto | null;
  readonly verse: VerseDto;
  readonly reading: TodayReadingDto | null;
  readonly streaks: TodayStreaksDto;
}
