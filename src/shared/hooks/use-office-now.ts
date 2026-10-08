import { useEffect, useState } from 'react';
import { OFFICE_TIME_ZONE } from '@/shared/config';
import { getZonedNow, type ZonedNow } from '@/shared/lib';

const TICK_MS = 15_000;

/**
 * The office wall clock, kept current while the page is open.
 *
 * `initialAt` comes from the server render, so the first client render draws exactly what
 * the server drew — no hydration mismatch at a minute boundary. After that it ticks, and
 * catches up immediately when a backgrounded tab comes back: a slot that turned into the
 * past while the laptop was closed must not stay clickable.
 */
export function useOfficeNow(initialAt: number): ZonedNow {
  const [at, setAt] = useState(initialAt);

  useEffect(() => {
    const sync = () => setAt(Date.now());
    sync();
    const timer = window.setInterval(sync, TICK_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return getZonedNow(OFFICE_TIME_ZONE, at);
}
