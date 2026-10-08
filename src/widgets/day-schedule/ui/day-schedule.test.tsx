import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ZonedNow } from '@/shared/lib';
import { mockFetch, renderWithQuery } from '../../../../tests/render-with-query';
import { DaySchedule } from './day-schedule';

const DAY = '2030-01-10';
const now: ZonedNow = { date: DAY, minutes: 12 * 60 };

const renderSchedule = (props: Partial<Parameters<typeof DaySchedule>[0]> = {}) =>
  renderWithQuery(
    <DaySchedule
      date={DAY}
      now={now}
      onSelectSlot={vi.fn()}
      onSelectBooking={vi.fn()}
      {...props}
    />,
  );

afterEach(() => vi.unstubAllGlobals());

describe('DaySchedule', () => {
  it('shows a loading state first', () => {
    mockFetch(() => ({ status: 200, body: [] }));
    renderSchedule();
    expect(screen.getByRole('status', { name: 'Загружаем расписание' })).toBeInTheDocument();
  });

  it('shows the empty state and lets the user pick a free future slot', async () => {
    mockFetch(() => ({ status: 200, body: [] }));
    const onSelectSlot = vi.fn();
    const user = userEvent.setup();
    renderSchedule({ onSelectSlot });

    expect(await screen.findByText('На этот день броней пока нет')).toBeInTheDocument();
    // 11:30 is in the past at 12:00 — no button for it.
    expect(screen.queryByRole('button', { name: 'Забронировать с 11:30' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Забронировать с 12:00' }));
    expect(onSelectSlot).toHaveBeenCalledWith({ start: '12:00', end: '12:30' });
  });

  it('shows bookings as buttons that open them', async () => {
    const booking = { id: 'b1', date: DAY, start: '14:00', end: '15:00', title: 'Ретро' };
    mockFetch(() => ({ status: 200, body: [booking] }));
    const onSelectBooking = vi.fn();
    const user = userEvent.setup();
    renderSchedule({ onSelectBooking });

    await user.click(await screen.findByRole('button', { name: /14:00–15:00, Ретро/ }));
    expect(onSelectBooking).toHaveBeenCalledWith(booking);
  });

  it('shows an error with a working retry', async () => {
    let fail = true;
    mockFetch(() =>
      fail
        ? { status: 500, body: { code: 'HTTP_500', message: 'boom' } }
        : { status: 200, body: [] },
    );
    const user = userEvent.setup();
    renderSchedule();

    expect(await screen.findByText('Не удалось загрузить расписание')).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByText('На этот день броней пока нет')).toBeInTheDocument();
  });
});
