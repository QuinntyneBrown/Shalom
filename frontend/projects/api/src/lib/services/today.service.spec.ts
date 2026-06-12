import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { TodayDto } from '../models/today-dto';
import { TodayService } from './today.service';

const BASE = 'http://api.test';

const todayDto: TodayDto = {
  date: '2026-06-12',
  greetingName: 'quinn',
  checkIn: null,
  verse: {
    reference: 'John 3:16',
    text: 'For God so loved the world...',
    youVersionUrl: 'https://www.bible.com/bible/111/JHN.3.16',
  },
  reading: {
    dayId: 'day-1',
    dayNumber: 1,
    passageReference: 'John 1',
    youVersionUrl: 'https://www.bible.com/bible/111/JHN.1',
    completedToday: false,
    planName: 'John & His Letters',
    completedCount: 0,
    totalDays: 28,
  },
  streaks: { checkInCurrent: 0, checkInLongest: 0, readingCurrent: 0, readingLongest: 0 },
};

describe('TodayService', () => {
  let service: TodayService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(TodayService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GETs /api/today and resolves the aggregate', async () => {
    const promise = service.getToday();

    const req = http.expectOne(`${BASE}/api/today`);
    expect(req.request.method).toBe('GET');
    req.flush(todayDto);

    await expect(promise).resolves.toEqual(todayDto);
  });
});
