import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { GratitudeEntryDto } from '../models/gratitude-entry-dto';
import { GratitudeService } from './gratitude.service';

const BASE = 'http://api.test';

const entry: GratitudeEntryDto = {
  id: 'g-1',
  personId: 'p-1',
  text: 'The way she prayed with the girls last night.',
  occurredOn: '2026-06-12',
};

describe('GratitudeService', () => {
  let service: GratitudeService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(GratitudeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('POSTs the note to /api/gratitude', async () => {
    const body = { text: 'The way she prayed with the girls last night.', personId: 'p-1' };
    const promise = service.add(body);

    const req = http.expectOne(`${BASE}/api/gratitude`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(entry);

    await expect(promise).resolves.toEqual(entry);
  });

  it('GETs /api/gratitude with no params by default', async () => {
    const promise = service.list();

    const req = http.expectOne(`${BASE}/api/gratitude`);
    expect(req.request.method).toBe('GET');
    req.flush([entry]);

    await expect(promise).resolves.toEqual([entry]);
  });

  it('GETs /api/gratitude with personId and take', async () => {
    const promise = service.list('p-1', 5);

    const req = http.expectOne(
      (r) => r.url === `${BASE}/api/gratitude` &&
        r.params.get('personId') === 'p-1' &&
        r.params.get('take') === '5',
    );
    expect(req.request.method).toBe('GET');
    req.flush([entry]);

    await expect(promise).resolves.toEqual([entry]);
  });
});
