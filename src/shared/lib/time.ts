/** Calendar date in the contract's wire format: `YYYY-MM-DD`. */
export type IsoDate = string;
/** Wall-clock time of day in the contract's wire format: `HH:mm`, 24h. */
export type ClockTime = string;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const pad = (value: number) => String(value).padStart(2, '0');

/** Strict: the shape must match AND the day must exist — `2026-02-30` is not a date. */
export function isIsoDate(value: string): value is IsoDate {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function isClockTime(value: string): value is ClockTime {
  return TIME_PATTERN.test(value);
}

/** `09:30` → `570`. The caller guarantees the format (see `isClockTime`). */
export function toMinutes(time: ClockTime): number {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

/** `570` → `09:30`. */
export function fromMinutes(total: number): ClockTime {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/**
 * Calendar arithmetic in UTC on purpose: a date here is a label, not an instant, so no
 * daylight-saving shift may ever turn «+1 day» into «+23 hours».
 */
export function addDays(date: IsoDate, days: number): IsoDate {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}
