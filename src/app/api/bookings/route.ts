import {
  badRequest,
  createBookingBody,
  getBookingService,
  listBookingsQuery,
  readJsonBody,
  simulateLatency,
  toResponse,
  wantsRace,
} from '@/server/bookings';

export const dynamic = 'force-dynamic';

/** GET /api/bookings?date=YYYY-MM-DD */
export async function GET(request: Request) {
  await simulateLatency();
  const query = listBookingsQuery.safeParse({
    date: new URL(request.url).searchParams.get('date'),
  });
  if (!query.success) return badRequest('Query parameter `date` (YYYY-MM-DD) is required');
  return Response.json(getBookingService().list(query.data.date));
}

/** POST /api/bookings */
export async function POST(request: Request) {
  await simulateLatency();
  const body = createBookingBody.safeParse(await readJsonBody(request));
  if (!body.success) return badRequest('Body must be { date, start, end, title? }');
  return toResponse(
    getBookingService().create(body.data, { simulateRace: wantsRace(request) }),
    201,
  );
}
