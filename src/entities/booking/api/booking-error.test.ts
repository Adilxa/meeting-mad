import { ApiError } from '@/shared/api';
import { toBookingRequestError } from './booking-error';

describe('toBookingRequestError', () => {
  it('maps 409 to a conflict with the conflicting bookings', () => {
    const error = new ApiError(409, {
      code: 'BOOKING_CONFLICT',
      message: 'busy',
      conflicts: [{ id: 'x', date: '2026-10-08', start: '10:00', end: '11:00', title: 'Демо' }],
    });
    expect(toBookingRequestError(error)).toEqual({
      kind: 'conflict',
      conflicts: [{ id: 'x', date: '2026-10-08', start: '10:00', end: '11:00', title: 'Демо' }],
    });
  });

  it('keeps only understood violations from a 422', () => {
    const error = new ApiError(422, {
      code: 'VALIDATION_FAILED',
      message: 'bad',
      violations: [
        { code: 'TOO_LONG', field: 'end' },
        { code: 'SOMETHING_NEW', field: 'end' },
      ],
    });
    expect(toBookingRequestError(error)).toEqual({
      kind: 'validation',
      violations: [{ code: 'TOO_LONG', field: 'end' }],
    });
  });

  it('recognises locked, missing and unreachable', () => {
    expect(
      toBookingRequestError(new ApiError(422, { code: 'BOOKING_STARTED', message: '' })),
    ).toEqual({
      kind: 'locked',
    });
    expect(
      toBookingRequestError(new ApiError(404, { code: 'BOOKING_NOT_FOUND', message: '' })),
    ).toEqual({
      kind: 'not-found',
    });
    expect(toBookingRequestError(new ApiError(0, { code: 'NETWORK_ERROR', message: '' }))).toEqual({
      kind: 'network',
    });
  });

  it('falls back to unknown for anything else', () => {
    expect(toBookingRequestError(new ApiError(500, { code: 'HTTP_500', message: 'boom' }))).toEqual(
      {
        kind: 'unknown',
        message: 'boom',
      },
    );
  });
});
