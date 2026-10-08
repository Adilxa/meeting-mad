import { formatDuration } from '@/shared/lib';
import {
  type BookingViolation,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  TITLE_MAX_LENGTH,
  WORKDAY_END,
  WORKDAY_START,
} from '../model';
import { formatBookingLabel } from './format';

/** Human wording for a rule violation. The domain reports codes; this is where they get words. */
export function violationMessage(violation: BookingViolation): string {
  switch (violation.code) {
    case 'INVALID_DATE':
      return 'Некорректная дата';
    case 'INVALID_TIME':
      return 'Укажите время в формате ЧЧ:ММ';
    case 'TITLE_TOO_LONG':
      return `Название — не длиннее ${TITLE_MAX_LENGTH} символов`;
    case 'OUTSIDE_WORKING_HOURS':
      return `Переговорная доступна с ${WORKDAY_START} до ${WORKDAY_END}`;
    case 'END_NOT_AFTER_START':
      return 'Окончание должно быть позже начала';
    case 'TOO_SHORT':
      return `Минимальная длительность — ${formatDuration(MIN_DURATION_MINUTES)}`;
    case 'TOO_LONG':
      return `Максимальная длительность — ${formatDuration(MAX_DURATION_MINUTES)}`;
    case 'PAST_DATE':
      return 'Нельзя бронировать на прошедшую дату';
    case 'PAST_TIME':
      return 'Это время уже прошло';
    case 'OVERLAP': {
      const [first, ...rest] = violation.conflicts;
      if (!first) return 'Время пересекается с другой бронью';
      const more = rest.length > 0 ? ` и ещё ${rest.length}` : '';
      return `Пересекается с бронью ${formatBookingLabel(first)}${more}`;
    }
  }
}
