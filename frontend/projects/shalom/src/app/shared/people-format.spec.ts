import {
  daysBetweenIso,
  daysUntilLabel,
  initialOf,
  lastContactLabel,
  personCaption,
  smsHref,
  telHref,
} from './people-format';

describe('people-format', () => {
  it('initialOf takes the first letter uppercased', () => {
    expect(initialOf('natalie')).toBe('N');
    expect(initialOf('  Maya')).toBe('M');
    expect(initialOf('')).toBe('?');
  });

  it('daysBetweenIso counts calendar days across month boundaries', () => {
    expect(daysBetweenIso('2026-06-12', '2026-06-12')).toBe(0);
    expect(daysBetweenIso('2026-06-10', '2026-06-12')).toBe(2);
    expect(daysBetweenIso('2026-05-29', '2026-06-12')).toBe(14);
    expect(daysBetweenIso('2026-12-30', '2027-01-02')).toBe(3);
  });

  it('lastContactLabel renders today / yesterday / N days ago / null', () => {
    expect(lastContactLabel('2026-06-12', '2026-06-12')).toBe('connected today');
    expect(lastContactLabel('2026-06-11', '2026-06-12')).toBe('yesterday');
    expect(lastContactLabel('2026-05-29', '2026-06-12')).toBe('14 days ago');
    expect(lastContactLabel(null, '2026-06-12')).toBeNull();
  });

  it('personCaption joins relationship and contact with a dash for never-contacted', () => {
    expect(personCaption('Wife', '2026-06-12', '2026-06-12')).toBe('Wife · connected today');
    expect(personCaption('Friend', null, '2026-06-12')).toBe('Friend · –');
    expect(personCaption(null, null, '2026-06-12')).toBe('–');
  });

  it('smsHref carries the phone and a warm first-name draft', () => {
    const href = smsHref('+1 416 555 0100', 'Natalie Brown');
    expect(href.startsWith('sms:+1 416 555 0100&body=')).toBe(true);
    expect(decodeURIComponent(href.split('&body=')[1])).toBe('Hey Natalie — thinking of you.');
  });

  it('telHref is a plain tel link', () => {
    expect(telHref('+1 416 555 0100')).toBe('tel:+1 416 555 0100');
  });

  it('daysUntilLabel renders today / tomorrow / in N days', () => {
    expect(daysUntilLabel(0)).toBe('today');
    expect(daysUntilLabel(1)).toBe('tomorrow');
    expect(daysUntilLabel(5)).toBe('in 5 days');
  });
});
