import { countdownLabel, minutesUntil, parseTimeMinutes, timeBand } from './time-band';

/** A local Date at HH:mm on an arbitrary fixed day. */
function at(hours: number, minutes: number): Date {
  return new Date(2026, 5, 12, hours, minutes, 0);
}

describe('timeBand', () => {
  it('is night from 22:00 through 4:29', () => {
    expect(timeBand(at(22, 0))).toBe('night');
    expect(timeBand(at(23, 59))).toBe('night');
    expect(timeBand(at(0, 0))).toBe('night');
    expect(timeBand(at(4, 29))).toBe('night');
  });

  it('morning starts at 4:30 and runs to the default 11:00 edge without a window', () => {
    expect(timeBand(at(4, 30))).toBe('morning');
    expect(timeBand(at(6, 11))).toBe('morning');
    expect(timeBand(at(10, 59))).toBe('morning');
    expect(timeBand(at(11, 0))).toBe('midday');
  });

  it("prefers the day's eating window for the morning→midday edge", () => {
    const window = { start: '12:00:00', end: '20:00:00' };
    expect(timeBand(at(11, 30), window)).toBe('morning');
    expect(timeBand(at(12, 0), window)).toBe('midday');
  });

  it('midday ends at 17:00; evening at 22:00', () => {
    expect(timeBand(at(16, 59))).toBe('midday');
    expect(timeBand(at(17, 0))).toBe('evening');
    expect(timeBand(at(18, 20))).toBe('evening');
    expect(timeBand(at(21, 59))).toBe('evening');
  });

  it('the window-derived edge is clamped to 9:00–14:00 so no band disappears', () => {
    const lateWindow = { start: '18:00:00', end: '23:00:00' };
    expect(timeBand(at(13, 59), lateWindow)).toBe('morning');
    expect(timeBand(at(14, 0), lateWindow)).toBe('midday');
    expect(timeBand(at(16, 0), lateWindow)).toBe('midday');
    expect(timeBand(at(17, 30), lateWindow)).toBe('evening');

    const dawnWindow = { start: '06:00:00', end: '14:00:00' };
    expect(timeBand(at(8, 0), dawnWindow)).toBe('morning');
    expect(timeBand(at(9, 0), dawnWindow)).toBe('midday');
  });

  it('a malformed window start falls back to 11:00', () => {
    expect(timeBand(at(11, 30), { start: 'nope', end: '20:00:00' })).toBe('midday');
  });
});

describe('parseTimeMinutes', () => {
  it('parses HH:mm and HH:mm:ss', () => {
    expect(parseTimeMinutes('11:00:00')).toBe(660);
    expect(parseTimeMinutes('19:30')).toBe(1170);
  });

  it('rejects malformed values', () => {
    expect(parseTimeMinutes('')).toBeNull();
    expect(parseTimeMinutes('25:00:00')).toBeNull();
    expect(parseTimeMinutes('9:00')).toBeNull();
  });
});

describe('minutesUntil', () => {
  it('counts down to a later wall-clock time and goes negative after it', () => {
    expect(minutesUntil(at(18, 20), '19:00:00')).toBe(40);
    expect(minutesUntil(at(19, 30), '19:00:00')).toBe(-30);
  });
});

describe('countdownLabel', () => {
  it('formats sub-hour and multi-hour spans', () => {
    expect(countdownLabel(40)).toBe('40 minutes');
    expect(countdownLabel(1)).toBe('1 minute');
    expect(countdownLabel(373)).toBe('6h 13m');
    expect(countdownLabel(-5)).toBe('0 minutes');
  });
});
