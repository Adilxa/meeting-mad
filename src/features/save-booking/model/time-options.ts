import type { TimeOption } from '@/entities/booking';
import { isClockTime, toMinutes } from '@/shared/lib';

/**
 * Keeps an off-grid current value selectable (a booking made via the API at 10:07 must
 * still open in the form) without letting it be duplicated.
 */
export function withCurrentValue(options: TimeOption[], value: string): TimeOption[] {
  if (!isClockTime(value) || options.some((option) => option.value === value)) return options;
  return [...options, { value }].sort((a, b) => toMinutes(a.value) - toMinutes(b.value));
}

export function optionLabel(option: TimeOption): string {
  if (option.disabledReason === 'busy') return `${option.value} — занято`;
  if (option.disabledReason === 'past') return `${option.value} — прошло`;
  return option.value;
}
