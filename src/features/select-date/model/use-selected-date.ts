'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { type IsoDate, isIsoDate } from '@/shared/lib';

const PARAM = 'date';

/**
 * The selected day lives in the URL (`?date=2026-10-08`): it survives a reload, can be
 * shared as a link, and Back walks through the days. Today is the default and keeps the
 * URL clean. A garbage value falls back to today instead of breaking the page.
 */
export function useSelectedDate(today: IsoDate): [IsoDate, (date: IsoDate) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = searchParams.get(PARAM);
  const date = raw && isIsoDate(raw) ? raw : today;

  const setDate = useCallback(
    (next: IsoDate) => {
      if (!isIsoDate(next)) return;
      const params = new URLSearchParams(searchParams.toString());
      if (next === today) params.delete(PARAM);
      else params.set(PARAM, next);
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, today],
  );

  return [date, setDate];
}
