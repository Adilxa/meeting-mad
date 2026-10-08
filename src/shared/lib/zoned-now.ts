import type { IsoDate } from './time';

/** «Now» as a wall clock somewhere: the local date and minutes since its midnight. */
export type ZonedNow = {
  date: IsoDate;
  minutes: number;
};

/**
 * Reads the wall clock of `timeZone` at the instant `at`.
 *
 * The browser's own zone is deliberately not used: a laptop on a business trip and a
 * server in UTC must agree on what «today, 10:15» means for a room that does not move.
 */
export function getZonedNow(timeZone: string, at: number = Date.now()): ZonedNow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(at));

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '00';

  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    minutes: Number(part('hour')) * 60 + Number(part('minute')),
  };
}
