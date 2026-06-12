import {
  addDays,
  formatElapsed,
  formatStarted,
  formatWindowTime,
  localDateOf,
  mondayOf,
  toIsoDate,
} from './health-format';

describe('health-format', () => {
  it('formats elapsed milliseconds as Xh Ym', () => {
    expect(formatElapsed(0)).toBe('0h 0m');
    expect(formatElapsed(11.4 * 3_600_000)).toBe('11h 24m');
    expect(formatElapsed(16 * 3_600_000)).toBe('16h 0m');
    expect(formatElapsed(-5_000)).toBe('0h 0m');
  });

  it('trims TimeOnly strings to HH:mm', () => {
    expect(formatWindowTime('12:00:00')).toBe('12:00');
    expect(formatWindowTime('13:30:00.0000000')).toBe('13:30');
  });

  it('formats local iso dates', () => {
    expect(toIsoDate(new Date(2026, 5, 12, 23, 30))).toBe('2026-06-12');
  });

  it('finds the Monday of a week (Monday-first)', () => {
    // 2026-06-12 is a Friday; 2026-06-14 a Sunday.
    expect(toIsoDate(mondayOf(new Date(2026, 5, 12)))).toBe('2026-06-08');
    expect(toIsoDate(mondayOf(new Date(2026, 5, 14)))).toBe('2026-06-08');
    expect(toIsoDate(mondayOf(new Date(2026, 5, 8)))).toBe('2026-06-08');
  });

  it('adds days', () => {
    expect(toIsoDate(addDays(new Date(2026, 5, 12), -13))).toBe('2026-05-30');
  });

  it('localDateOf uses the browser-local day of a timestamp', () => {
    const iso = new Date(2026, 5, 11, 22, 15).toISOString();
    expect(localDateOf(iso)).toBe('2026-06-11');
  });

  it('describes when a fast started relative to today', () => {
    const now = new Date(2026, 5, 12, 6, 11);
    const lastNight = new Date(2026, 5, 11, 20, 36);
    expect(formatStarted(lastNight.toISOString(), now)).toMatch(/^yesterday /);

    const thisMorning = new Date(2026, 5, 12, 0, 30);
    expect(formatStarted(thisMorning.toISOString(), now)).toMatch(/^today /);

    const older = new Date(2026, 5, 9, 8, 0);
    expect(formatStarted(older.toISOString(), now)).toMatch(/^Jun 9/);
  });
});
