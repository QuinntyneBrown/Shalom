import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

/** Local-time helper on a June day (Toronto sunrise ≈ 05:36 EDT). */
function juneAt(hours: number, minutes = 0): Date {
  return new Date(2026, 5, 12, hours, minutes, 0);
}

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('sh-dawn');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    document.body.classList.remove('sh-dawn');
  });

  it('defaults to auto: dawn in the night band and before sunrise, light by day', () => {
    expect(service.preference()).toBe('auto');

    expect(service.isDawn(juneAt(23, 0))).toBe(true); // night band
    expect(service.isDawn(juneAt(3, 0))).toBe(true); // night band (small hours)
    expect(service.isDawn(juneAt(5, 0))).toBe(true); // morning band but pre-sunrise
    expect(service.isDawn(juneAt(8, 0))).toBe(false); // daylight
    expect(service.isDawn(juneAt(18, 30))).toBe(false); // evening, no dark preference
  });

  it('a December 7:00 morning is still dawn (sunrise ≈ 7:45)', () => {
    expect(service.isDawn(new Date(2026, 11, 21, 7, 0, 0))).toBe(true);
    expect(service.isDawn(new Date(2026, 11, 21, 9, 0, 0))).toBe(false);
  });

  it('manual overrides win in both directions and persist', () => {
    service.setPreference('dawn');
    expect(service.isDawn(juneAt(12, 0))).toBe(true);
    expect(localStorage.getItem('sh.theme')).toBe('dawn');

    service.setPreference('light');
    expect(service.isDawn(juneAt(23, 0))).toBe(false);
    expect(localStorage.getItem('sh.theme')).toBe('light');
  });

  it('start() applies the body class and is idempotent', () => {
    service.setPreference('dawn');
    service.start();
    service.start();

    expect(document.body.classList.contains('sh-dawn')).toBe(true);

    service.setPreference('light');
    expect(document.body.classList.contains('sh-dawn')).toBe(false);
  });

  it('rehydrates a persisted preference', () => {
    localStorage.setItem('sh.theme', 'dawn');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(ThemeService);

    expect(fresh.preference()).toBe('dawn');
  });
});
