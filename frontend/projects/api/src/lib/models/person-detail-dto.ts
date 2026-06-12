import { ImportantDateDto } from './important-date-dto';
import { PersonDto } from './person-dto';

/** `GET /api/people/{id}` — the person plus their important dates with derived daysUntil. */
export interface PersonDetailDto extends PersonDto {
  readonly dates: ImportantDateDto[];
}
