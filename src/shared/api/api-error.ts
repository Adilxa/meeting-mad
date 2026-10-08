/**
 * Error body of the bookings API — the same shape for every 4xx/5xx:
 * `{ code, message, ...details }`. Branch on `code`, never on `message`.
 */
export type ApiErrorPayload = {
  code: string;
  message: string;
  [detail: string]: unknown;
};

/** Code used when the request never got an HTTP answer (offline, DNS, CORS, abort). */
export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** The whole error body — slices read their own details (`conflicts`, `violations`…). */
  readonly payload: ApiErrorPayload;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload.code;
    this.payload = payload;
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}
