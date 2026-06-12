import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { ReadingDayDto } from '../models/reading-day-dto';
import { ReadingPlanDto } from '../models/reading-plan-dto';
import { ReadingService } from './reading.service';

const BASE = 'http://api.test';

const day: ReadingDayDto = {
  id: 'day-1',
  dayNumber: 1,
  passageReference: 'John 1',
  youVersionUrl: 'https://www.bible.com/bible/111/JHN.1',
  completedOn: '2026-06-12',
};

const plan: ReadingPlanDto = {
  id: 'plan-1',
  name: 'John & His Letters',
  startDate: '2026-06-15',
  isActive: true,
  completedCount: 1,
  totalDays: 28,
  days: [day],
};

describe('ReadingService', () => {
  let service: ReadingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(ReadingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GETs /api/reading/plan', async () => {
    const promise = service.getPlan();

    const req = http.expectOne(`${BASE}/api/reading/plan`);
    expect(req.request.method).toBe('GET');
    req.flush(plan);

    await expect(promise).resolves.toEqual(plan);
  });

  it('POSTs to /api/reading/days/{id}/complete', async () => {
    const promise = service.completeDay('day-1');

    const req = http.expectOne(`${BASE}/api/reading/days/day-1/complete`);
    expect(req.request.method).toBe('POST');
    req.flush(day);

    await expect(promise).resolves.toEqual(day);
  });

  it('DELETEs /api/reading/days/{id}/complete', async () => {
    const promise = service.uncompleteDay('day-1');

    const req = http.expectOne(`${BASE}/api/reading/days/day-1/complete`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    await expect(promise).resolves.toBeUndefined();
  });
});
