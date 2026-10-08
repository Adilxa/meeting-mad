import { toMinutes } from '@/shared/lib';

/** Business rules of the room, in one place. Server and client read the same numbers. */
export const WORKDAY_START = '09:00';
export const WORKDAY_END = '18:00';
export const MIN_DURATION_MINUTES = 30;
export const MAX_DURATION_MINUTES = 120;
export const TITLE_MAX_LENGTH = 100;

/** Granularity of the time pickers. A UI choice, not a rule: the API accepts any minute. */
export const TIME_STEP_MINUTES = 15;
/** Duration of one clickable cell on the timeline. */
export const GRID_SLOT_MINUTES = 30;

export const WORKDAY_START_MINUTES = toMinutes(WORKDAY_START);
export const WORKDAY_END_MINUTES = toMinutes(WORKDAY_END);
