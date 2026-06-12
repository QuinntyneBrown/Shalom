import { InjectionToken } from '@angular/core';

import { AddImportantDateRequest } from '../models/add-important-date-request';
import { ConnectionNudgeDto } from '../models/connection-nudge-dto';
import { ImportantDateDto } from '../models/important-date-dto';
import { PersonDetailDto } from '../models/person-detail-dto';
import { PersonDto } from '../models/person-dto';
import { SavePersonRequest } from '../models/save-person-request';

/**
 * HTTP boundary for `/api/people/*` (important dates included — they live
 * under people on the wire). Contact facts move only through
 * `recordContact`/`snooze`; nudges are derived server-side (ADR-004).
 */
export interface IPeopleService {
  /** Active people, ordered by name. */
  list(): Promise<PersonDto[]>;
  /** The person plus their important dates with derived daysUntil. */
  get(id: string): Promise<PersonDetailDto>;
  create(req: SavePersonRequest): Promise<PersonDto>;
  update(id: string, req: SavePersonRequest): Promise<PersonDto>;
  /** DELETE verb, archive semantics — history is never destroyed. */
  archive(id: string): Promise<void>;
  /** "Connected" — the server stamps its local today and clears any snooze. */
  recordContact(id: string): Promise<PersonDto>;
  /** "Not today" — quiet until tomorrow. */
  snooze(id: string): Promise<PersonDto>;
  /** ALL currently-due people with rendered prompts (most overdue first). */
  nudges(): Promise<ConnectionNudgeDto[]>;
  addDate(personId: string, req: AddImportantDateRequest): Promise<ImportantDateDto>;
  removeDate(dateId: string): Promise<void>;
}

export const PEOPLE_SERVICE = new InjectionToken<IPeopleService>('PEOPLE_SERVICE');
