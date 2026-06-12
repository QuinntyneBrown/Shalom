import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { WorkoutDto } from '../models/workout-dto';
import { WorkoutsService } from './workouts.service';

const BASE = 'http://api.test';

const workout: WorkoutDto = {
  id: 'w-1',
  equipment: 'IndoorBike',
  startedAt: '2026-06-12T11:00:00+00:00',
  durationMinutes: 25,
  distanceKm: null,
  avgHeartRateBpm: null,
  activeCalories: null,
  notes: 'effort:steady',
};

describe('WorkoutsService', () => {
  let service: WorkoutsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(WorkoutsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('POSTs to /api/workouts', async () => {
    const body = { equipment: 'IndoorBike' as const, durationMinutes: 25, notes: 'effort:steady' };
    const promise = service.log(body);

    const req = http.expectOne(`${BASE}/api/workouts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(workout);

    await expect(promise).resolves.toEqual(workout);
  });

  it('GETs /api/workouts with from/to params', async () => {
    const promise = service.list('2026-06-08', '2026-06-12');

    const req = http.expectOne(
      (r) => r.url === `${BASE}/api/workouts` &&
        r.params.get('from') === '2026-06-08' &&
        r.params.get('to') === '2026-06-12',
    );
    expect(req.request.method).toBe('GET');
    req.flush([workout]);

    await expect(promise).resolves.toEqual([workout]);
  });

  it('DELETEs /api/workouts/{id}', async () => {
    const promise = service.delete('w-1');

    const req = http.expectOne(`${BASE}/api/workouts/w-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    await expect(promise).resolves.toBeUndefined();
  });
});
