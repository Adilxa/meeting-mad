import { z } from 'zod';

/*
 * Shape of request bodies only: «is this JSON what the contract says». Whether the values
 * make sense (working hours, duration, overlaps) is the domain's job, not the schema's.
 */
const time = z.string();

export const createBookingBody = z.object({
  date: z.string(),
  start: time,
  end: time,
  title: z.string().optional(),
});

export const updateBookingBody = createBookingBody.partial();

export const listBookingsQuery = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});
