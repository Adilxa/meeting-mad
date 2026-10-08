import { addDays, fromMinutes, isClockTime, isIsoDate, toMinutes } from './time';

describe('time helpers', () => {
  it('accepts only real calendar dates', () => {
    expect(isIsoDate('2026-10-08')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-1-08')).toBe(false);
    expect(isIsoDate('')).toBe(false);
  });

  it('accepts only 24h HH:mm', () => {
    expect(isClockTime('09:00')).toBe(true);
    expect(isClockTime('23:59')).toBe(true);
    expect(isClockTime('24:00')).toBe(false);
    expect(isClockTime('9:00')).toBe(false);
  });

  it('converts between HH:mm and minutes', () => {
    expect(toMinutes('09:30')).toBe(570);
    expect(fromMinutes(570)).toBe('09:30');
    expect(fromMinutes(toMinutes('17:45'))).toBe('17:45');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});
