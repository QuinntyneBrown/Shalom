import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { MealEntryDto } from '../models/meal-entry-dto';
import { MealsService } from './meals.service';

const BASE = 'http://api.test';

const meal: MealEntryDto = {
  id: 'm-1',
  text: 'salmon + greens',
  tags: ['home-cooked', 'fish'],
  occurredAt: '2026-06-11T23:30:00+00:00',
};

describe('MealsService', () => {
  let service: MealsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(MealsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('POSTs to /api/meals', async () => {
    const body = { text: 'salmon + greens', tags: ['home-cooked', 'fish'] as MealEntryDto['tags'] };
    const promise = service.log(body);

    const req = http.expectOne(`${BASE}/api/meals`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(meal);

    await expect(promise).resolves.toEqual(meal);
  });

  it('GETs /api/meals with from/to params', async () => {
    const promise = service.list('2026-06-08', '2026-06-12');

    const req = http.expectOne(
      (r) => r.url === `${BASE}/api/meals` &&
        r.params.get('from') === '2026-06-08' &&
        r.params.get('to') === '2026-06-12',
    );
    expect(req.request.method).toBe('GET');
    req.flush([meal]);

    await expect(promise).resolves.toEqual([meal]);
  });
});
