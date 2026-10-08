'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api';
import type { BookingDraft } from '../model';
import { bookingApi } from './booking-api';

/*
 * After ANY answer — success or refusal — our picture of the day may be wrong: on success
 * there is a new booking, on 409/404/422 someone changed the day behind our back. So every
 * mutation refreshes the schedule, and does it in the hook-level callback, which TanStack
 * awaits before the caller's own `onSuccess`/`onError` run. A form reacting to a 409
 * therefore already sees the refreshed day.
 */

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
  return useMutation({
    mutationFn: (draft: BookingDraft) => bookingApi.create(draft),
    onSettled: refresh,
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
  return useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: BookingDraft }) =>
      bookingApi.update(id, draft),
    onSettled: refresh,
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
  return useMutation({
    mutationFn: (id: string) => bookingApi.remove(id),
    onSettled: refresh,
  });
}
