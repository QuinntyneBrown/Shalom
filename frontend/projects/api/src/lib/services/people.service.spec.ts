import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { ConnectionNudgeDto } from '../models/connection-nudge-dto';
import { ImportantDateDto } from '../models/important-date-dto';
import { PersonDetailDto } from '../models/person-detail-dto';
import { PersonDto } from '../models/person-dto';
import { PeopleService } from './people.service';

const BASE = 'http://api.test';

const natalie: PersonDto = {
  id: 'p-1',
  name: 'Natalie',
  relationship: 'Wife',
  phone: '+1 416 555 0100',
  contactCadenceDays: 2,
  notes: null,
  lastContactedOn: null,
  snoozedUntil: null,
};

const anniversary: ImportantDateDto = {
  id: 'd-1',
  personId: 'p-1',
  label: 'Anniversary',
  month: 8,
  day: 23,
  year: null,
  leadDays: 7,
  nextOccurrence: '2026-08-23',
  daysUntil: 72,
};

const detail: PersonDetailDto = { ...natalie, dates: [anniversary] };

const nudge: ConnectionNudgeDto = {
  personId: 'p-1',
  name: 'Natalie',
  relationship: 'Wife',
  prompt: 'Ask Natalie about her day — and really listen.',
  phone: '+1 416 555 0100',
};

describe('PeopleService', () => {
  let service: PeopleService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(PeopleService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GETs /api/people', async () => {
    const promise = service.list();

    const req = http.expectOne(`${BASE}/api/people`);
    expect(req.request.method).toBe('GET');
    req.flush([natalie]);

    await expect(promise).resolves.toEqual([natalie]);
  });

  it('GETs /api/people/{id} with the dates', async () => {
    const promise = service.get('p-1');

    const req = http.expectOne(`${BASE}/api/people/p-1`);
    expect(req.request.method).toBe('GET');
    req.flush(detail);

    await expect(promise).resolves.toEqual(detail);
  });

  it('POSTs a new person to /api/people', async () => {
    const body = { name: 'Natalie', relationship: 'Wife', contactCadenceDays: 7 };
    const promise = service.create(body);

    const req = http.expectOne(`${BASE}/api/people`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(natalie);

    await expect(promise).resolves.toEqual(natalie);
  });

  it('PUTs updates to /api/people/{id}', async () => {
    const body = { name: 'Natalie', phone: '+1 416 555 0199' };
    const promise = service.update('p-1', body);

    const req = http.expectOne(`${BASE}/api/people/p-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush({ ...natalie, phone: '+1 416 555 0199' });

    await expect(promise).resolves.toMatchObject({ phone: '+1 416 555 0199' });
  });

  it('DELETEs /api/people/{id} to archive', async () => {
    const promise = service.archive('p-1');

    const req = http.expectOne(`${BASE}/api/people/p-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    await expect(promise).resolves.toBeNull();
  });

  it('POSTs to /api/people/{id}/contact', async () => {
    const promise = service.recordContact('p-1');

    const req = http.expectOne(`${BASE}/api/people/p-1/contact`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...natalie, lastContactedOn: '2026-06-12' });

    await expect(promise).resolves.toMatchObject({ lastContactedOn: '2026-06-12' });
  });

  it('POSTs to /api/people/{id}/snooze', async () => {
    const promise = service.snooze('p-1');

    const req = http.expectOne(`${BASE}/api/people/p-1/snooze`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...natalie, snoozedUntil: '2026-06-13' });

    await expect(promise).resolves.toMatchObject({ snoozedUntil: '2026-06-13' });
  });

  it('GETs /api/people/nudges', async () => {
    const promise = service.nudges();

    const req = http.expectOne(`${BASE}/api/people/nudges`);
    expect(req.request.method).toBe('GET');
    req.flush([nudge]);

    await expect(promise).resolves.toEqual([nudge]);
  });

  it('POSTs a date to /api/people/{id}/dates', async () => {
    const body = { label: 'Anniversary', month: 8, day: 23 };
    const promise = service.addDate('p-1', body);

    const req = http.expectOne(`${BASE}/api/people/p-1/dates`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(anniversary);

    await expect(promise).resolves.toEqual(anniversary);
  });

  it('DELETEs /api/important-dates/{id}', async () => {
    const promise = service.removeDate('d-1');

    const req = http.expectOne(`${BASE}/api/important-dates/d-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    await expect(promise).resolves.toBeNull();
  });
});
