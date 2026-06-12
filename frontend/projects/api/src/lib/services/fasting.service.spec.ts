import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { CurrentFastDto } from '../models/current-fast-dto';
import { FastingScheduleDto } from '../models/fasting-schedule-dto';
import { FastingSessionDto } from '../models/fasting-session-dto';
import { FastingService } from './fasting.service';

const BASE = 'http://api.test';

const openSession: FastingSessionDto = {
  id: 'fast-1',
  startedAt: '2026-06-11T00:36:00+00:00',
  targetHours: 16,
  endedAt: null,
  elapsedHours: 11.4,
  outcome: null,
};

const schedule: FastingScheduleDto = {
  eatingWindowStart: '12:00:00',
  eatingWindowEnd: '20:00:00',
  targetFastHours: 16,
  timeZoneId: 'America/Toronto',
  overrides: [
    { dayOfWeek: 'Sunday', eatingWindowStart: '13:30:00', eatingWindowEnd: '20:30:00' },
  ],
  todayWindow: { start: '12:00:00', end: '20:00:00' },
};

const current: CurrentFastDto = { current: openSession, schedule };

describe('FastingService', () => {
  let service: FastingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(FastingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GETs /api/fasting/current', async () => {
    const promise = service.getCurrent();

    const req = http.expectOne(`${BASE}/api/fasting/current`);
    expect(req.request.method).toBe('GET');
    req.flush(current);

    await expect(promise).resolves.toEqual(current);
  });

  it('POSTs to /api/fasting/start with an empty body by default', async () => {
    const promise = service.start();

    const req = http.expectOne(`${BASE}/api/fasting/start`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(openSession);

    await expect(promise).resolves.toEqual(openSession);
  });

  it('POSTs the explicit target hours when given', async () => {
    const promise = service.start({ targetHours: 18 });

    const req = http.expectOne(`${BASE}/api/fasting/start`);
    expect(req.request.body).toEqual({ targetHours: 18 });
    req.flush({ ...openSession, targetHours: 18 });

    await expect(promise).resolves.toMatchObject({ targetHours: 18 });
  });

  it('POSTs to /api/fasting/current/end', async () => {
    const ended: FastingSessionDto = {
      ...openSession,
      endedAt: '2026-06-11T17:00:00+00:00',
      outcome: 'Completed',
    };
    const promise = service.end();

    const req = http.expectOne(`${BASE}/api/fasting/current/end`);
    expect(req.request.method).toBe('POST');
    req.flush(ended);

    await expect(promise).resolves.toEqual(ended);
  });

  it('GETs /api/fasting/history with from/to params', async () => {
    const promise = service.history('2026-06-08', '2026-06-12');

    const req = http.expectOne(
      (r) => r.url === `${BASE}/api/fasting/history` &&
        r.params.get('from') === '2026-06-08' &&
        r.params.get('to') === '2026-06-12',
    );
    expect(req.request.method).toBe('GET');
    req.flush([openSession]);

    await expect(promise).resolves.toEqual([openSession]);
  });

  it('PUTs the schedule to /api/fasting/schedule', async () => {
    const body = {
      windowStart: '11:00:00',
      windowEnd: '19:00:00',
      targetFastHours: 17,
      overrides: [],
    };
    const promise = service.updateSchedule(body);

    const req = http.expectOne(`${BASE}/api/fasting/schedule`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush(schedule);

    await expect(promise).resolves.toEqual(schedule);
  });
});
