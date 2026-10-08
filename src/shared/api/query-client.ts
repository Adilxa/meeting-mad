import { isServer, QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-error';

/**
 * 4xx are answers, not failures: the slot is taken, the booking is gone, the input is
 * wrong. Asking again only costs the user a second of spinner. 408/429 mean «later».
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = ApiError.isApiError(error) ? error.status : undefined;
  if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) return false;
  return failureCount < 2;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
        retry: shouldRetry,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      // A mutation is never repeated behind the user's back — a retried POST is a second booking.
      mutations: { retry: 0 },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** One cache per browser tab; a fresh one per server request. */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
