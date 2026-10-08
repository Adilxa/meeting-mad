'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api';
import { bookingApi } from './booking-api';

/** Polling keeps a shared room honest: colleagues book while this tab stays open. */
const REFETCH_INTERVAL_MS = 30 * 1000;

/** Bookings of one day — `GET /bookings?date=`. */
export function useBookings(date: string) {
  return useQuery({
    queryKey: queryKeys.bookings.byDate(date),
    queryFn: ({ signal }) => bookingApi.list(date, signal),
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}
