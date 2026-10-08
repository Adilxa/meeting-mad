import type { IsoDate } from './time';

const longDate = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

const shortDate = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

function toUtcDate(date: IsoDate): Date {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** `2026-10-08` → «четверг, 8 октября». */
export function formatLongDate(date: IsoDate): string {
  return longDate.format(toUtcDate(date));
}

/** `2026-10-08` → «8 октября». */
export function formatShortDate(date: IsoDate): string {
  return shortDate.format(toUtcDate(date));
}

/** `90` → «1 ч 30 мин». */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} мин`;
  if (rest === 0) return `${hours} ч`;
  return `${hours} ч ${rest} мин`;
}
