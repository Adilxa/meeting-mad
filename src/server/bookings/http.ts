import { MOCK_SCENARIO_HEADER, MOCK_SCENARIO_RACE } from '@/shared/config';
import type { ServiceError, ServiceResult } from './service';

export function json(status: number, body: unknown): Response {
  return status === 204 ? new Response(null, { status }) : Response.json(body, { status });
}

export function badRequest(message: string): Response {
  return json(400, { code: 'BAD_REQUEST', message });
}

function errorResponse(error: ServiceError): Response {
  const { status, ...body } = error;
  return json(status, body);
}

export function toResponse<T>(result: ServiceResult<T>, successStatus = 200): Response {
  return result.ok ? json(successStatus, result.value) : errorResponse(result.error);
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function wantsRace(request: Request): boolean {
  return request.headers.get(MOCK_SCENARIO_HEADER) === MOCK_SCENARIO_RACE;
}

/** Makes loading and «saving…» states visible in the demo. Zero in tests. */
export function simulateLatency(): Promise<void> {
  const ms = Number(process.env.MOCK_LATENCY_MS ?? 400);
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}
