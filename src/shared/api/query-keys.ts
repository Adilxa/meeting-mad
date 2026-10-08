/**
 * Centralised React Query keys — hierarchical, so invalidating a prefix refreshes
 * everything under it: `['bookings']` covers every day.
 */
export const queryKeys = {
  bookings: {
    all: ['bookings'] as const,
    byDate: (date: string) => ['bookings', 'date', date] as const,
  },
};
