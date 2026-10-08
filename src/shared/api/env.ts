/**
 * Base URL of the API. `/api` is the mock served by Next route handlers in this repo;
 * pointing it at a real backend is the whole migration — nothing above `shared/api` knows.
 */
export const apiEnv = {
  baseUrl: (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, ''),
} as const;
