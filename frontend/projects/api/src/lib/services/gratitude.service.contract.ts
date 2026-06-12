import { InjectionToken } from '@angular/core';

import { AddGratitudeRequest } from '../models/add-gratitude-request';
import { GratitudeEntryDto } from '../models/gratitude-entry-dto';

/** HTTP boundary for `/api/gratitude` — private notes, just between him and God. */
export interface IGratitudeService {
  add(req: AddGratitudeRequest): Promise<GratitudeEntryDto>;
  /** Newest first; optionally only one person's notes. `take` defaults to 20 server-side. */
  list(personId?: string, take?: number): Promise<GratitudeEntryDto[]>;
}

export const GRATITUDE_SERVICE = new InjectionToken<IGratitudeService>('GRATITUDE_SERVICE');
