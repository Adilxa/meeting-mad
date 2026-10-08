import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Booking, useBookings } from '@/entities/booking';
import type { ZonedNow } from '@/shared/lib';
import { mockFetch, renderWithQuery } from '../../../../tests/render-with-query';
import { BookingForm } from './booking-form';

const DAY = '2030-01-10';
const now: ZonedNow = { date: '2030-01-09', minutes: 12 * 60 };

function Harness({ onSaved = vi.fn() }: { onSaved?: (booking: Booking) => void }) {
  const { data = [] } = useBookings(DAY);
  return (
    <BookingForm
      date={DAY}
      now={now}
      bookings={data}
      initialValues={{ start: '10:00', end: '11:00' }}
      onSaved={onSaved}
      onCancel={() => {}}
    />
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('BookingForm', () => {
  it('handles a 409: explains, refreshes the day and keeps what the user typed', async () => {
    const day: Booking[] = [];
    const fetchMock = mockFetch((url, init) => {
      if (init.method === 'POST') {
        // A colleague was faster: the slot is taken by the time our request lands.
        const colleague = { id: 'c1', date: DAY, start: '10:00', end: '11:00', title: 'Коллега' };
        day.push(colleague);
        return {
          status: 409,
          body: { code: 'BOOKING_CONFLICT', message: 'busy', conflicts: [colleague] },
        };
      }
      expect(url.searchParams.get('date')).toBe(DAY);
      return { status: 200, body: day };
    });
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderWithQuery(<Harness onSaved={onSaved} />);

    await user.type(screen.getByLabelText(/название/i), 'Демо');
    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Это время только что заняли');
    expect(alert).toHaveTextContent('10:00–11:00 «Коллега»');

    // The user's input survived.
    expect(screen.getByLabelText(/название/i)).toHaveValue('Демо');
    expect(screen.getByLabelText('Начало')).toHaveValue('10:00');
    expect(screen.getByLabelText('Окончание')).toHaveValue('11:00');

    // The schedule was fetched again, and the field now points at the conflict.
    const gets = fetchMock.mock.calls.filter(([, init]) => (init?.method ?? 'GET') === 'GET');
    expect(gets.length).toBeGreaterThanOrEqual(2);
    expect(await screen.findByText(/Пересекается с бронью 10:00–11:00/)).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('blocks an overlapping booking on the client without calling the API', async () => {
    const fetchMock = mockFetch((_url, init) => {
      if (init.method === 'POST') throw new Error('must not be called');
      return { status: 200, body: [{ id: 'a', date: DAY, start: '10:30', end: '11:30' }] };
    });
    const user = userEvent.setup();
    renderWithQuery(<Harness />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(await screen.findByText(/Пересекается с бронью 10:30–11:30/)).toBeInTheDocument();
    expect(screen.getByLabelText('Начало')).toHaveAttribute('aria-invalid', 'true');
  });

  it('creates a booking and reports it', async () => {
    mockFetch((_url, init) =>
      init.method === 'POST'
        ? { status: 201, body: { id: 'n1', ...JSON.parse(String(init.body)) } }
        : { status: 200, body: [] },
    );
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderWithQuery(<Harness onSaved={onSaved} />);

    await user.selectOptions(screen.getByLabelText('Начало'), '14:00');
    // Changing the start moved the end along with it.
    expect(screen.getByLabelText('Окончание')).toHaveValue('15:00');
    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    await waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith({ id: 'n1', date: DAY, start: '14:00', end: '15:00' }),
    );
  });
});
