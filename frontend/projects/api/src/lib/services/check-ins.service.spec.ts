import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { CheckInDto } from '../models/check-in-dto';
import { CheckInsService } from './check-ins.service';

const BASE = 'http://api.test';

const checkIn: CheckInDto = {
  id: 'c-1',
  date: '2026-06-12',
  moodRating: 4,
  spiritualRating: 3,
  note: 'steady',
};

describe('CheckInsService', () => {
  let service: CheckInsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(CheckInsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('PUTs the ratings to /api/check-ins/today without any date', async () => {
    const promise = service.upsertToday({ moodRating: 4, spiritualRating: 3, note: 'steady' });

    const req = http.expectOne(`${BASE}/api/check-ins/today`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ moodRating: 4, spiritualRating: 3, note: 'steady' });
    expect(JSON.stringify(req.request.body)).not.toContain('date');
    req.flush(checkIn);

    await expect(promise).resolves.toEqual(checkIn);
  });

  it('GETs /api/check-ins with from/to query params', async () => {
    const promise = service.list('2026-06-01', '2026-06-30');

    const req = http.expectOne(
      (r) => r.url === `${BASE}/api/check-ins` && r.method === 'GET',
    );
    expect(req.request.params.get('from')).toBe('2026-06-01');
    expect(req.request.params.get('to')).toBe('2026-06-30');
    req.flush([checkIn]);

    await expect(promise).resolves.toEqual([checkIn]);
  });
});
