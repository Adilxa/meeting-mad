import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

/** A fresh cache per test, no retries — a failing request should fail now, not in 6 seconds. */
export function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  });
  return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) };
}

type Handler = (url: URL, init: RequestInit) => { status: number; body?: unknown };

/** Stubs `fetch` with a tiny router; returns the mock to inspect calls. */
export function mockFetch(handler: Handler) {
  const fn = vi.fn(async (input: string, init: RequestInit = {}) => {
    const { status, body } = handler(new URL(input, 'http://localhost'), init);
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}
