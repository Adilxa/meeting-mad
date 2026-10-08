import {
  badRequest,
  getBookingService,
  readJsonBody,
  simulateLatency,
  toResponse,
  updateBookingBody,
  wantsRace,
} from '@/server/bookings';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

/** PATCH /api/bookings/:id */
export async function PATCH(request: Request, { params }: Context) {
  await simulateLatency();
  const { id } = await params;
  const body = updateBookingBody.safeParse(await readJsonBody(request));
  if (!body.success) return badRequest('Body must be a subset of { date, start, end, title }');
  return toResponse(
    getBookingService().update(id, body.data, { simulateRace: wantsRace(request) }),
  );
}

/** DELETE /api/bookings/:id */
export async function DELETE(_request: Request, { params }: Context) {
  await simulateLatency();
  const { id } = await params;
  return toResponse(getBookingService().remove(id), 204);
}
