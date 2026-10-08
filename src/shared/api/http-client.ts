import { ApiError, type ApiErrorPayload, NETWORK_ERROR_CODE } from './api-error';
import { apiEnv } from './env';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type RequestOptions = {
  query?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
};

const defaultHeaders = new Map<string, string>();

/**
 * Adds (or with `null` removes) a header sent with every request. Kept generic on purpose:
 * this module knows nothing about what the headers mean.
 */
export function setDefaultHeader(name: string, value: string | null): void {
  if (value === null) defaultHeaders.delete(name);
  else defaultHeaders.set(name, value);
}

function buildUrl(path: string, query?: Record<string, string>): string {
  const search = query ? `?${new URLSearchParams(query).toString()}` : '';
  return `${apiEnv.baseUrl}${path}${search}`;
}

function isErrorPayload(value: unknown): value is ApiErrorPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { code?: unknown }).code === 'string' &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function request<T>(method: HttpMethod, path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  for (const [name, value] of defaultHeaders) headers[name] = value;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      cache: 'no-store',
    });
  } catch (cause) {
    // An aborted query is TanStack's business (it cancelled it), not a network failure.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(0, {
      code: NETWORK_ERROR_CODE,
      message: 'Сервер недоступен. Проверьте подключение к сети.',
    });
  }

  const data = await readJson(response);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      isErrorPayload(data)
        ? data
        : { code: `HTTP_${response.status}`, message: response.statusText || 'Ошибка запроса' },
    );
  }
  return data as T;
}

/**
 * The one door to the network. Every slice's `api/` segment goes through it, so transport
 * concerns (base URL, headers, error normalisation) live in exactly one place.
 */
export const httpClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('GET', path, options),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, { body }),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
};
