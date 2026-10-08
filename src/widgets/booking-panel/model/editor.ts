import type { BookingFormValues } from '@/features/save-booking';

/**
 * What the side panel is doing. Owned by the page (the timeline needs to know too),
 * described here because the panel is what interprets it.
 */
export type BookingEditor =
  | { kind: 'idle' }
  | { kind: 'create'; initial: Partial<BookingFormValues>; key: number }
  | { kind: 'edit'; bookingId: string };

let sequence = 0;

/** Each new create session gets its own key, so the form remounts with fresh defaults. */
export function startCreating(initial: Partial<BookingFormValues> = {}): BookingEditor {
  sequence += 1;
  return { kind: 'create', initial, key: sequence };
}
