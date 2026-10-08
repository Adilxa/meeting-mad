'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  type Booking,
  formatBookingLabel,
  toBookingRequestError,
  useDeleteBooking,
} from '@/entities/booking';
import { Button, ConfirmDialog, Spinner } from '@/shared/ui';

type DeleteBookingButtonProps = {
  booking: Booking;
  onDeleted: () => void;
};

/** Delete with confirmation. A booking already gone counts as deleted — the goal is reached. */
export function DeleteBookingButton({ booking, onDeleted }: DeleteBookingButtonProps) {
  const [open, setOpen] = useState(false);
  const deleteBooking = useDeleteBooking();

  const confirm = () => {
    deleteBooking.mutate(booking.id, {
      onSuccess: () => {
        setOpen(false);
        toast.success(`Бронь ${formatBookingLabel(booking)} удалена`);
        onDeleted();
      },
      onError: (error) => {
        const failure = toBookingRequestError(error);
        setOpen(false);
        if (failure.kind === 'not-found') {
          toast.info('Бронь уже была удалена');
          onDeleted();
        } else if (failure.kind === 'locked') {
          toast.error('Бронь уже началась — удалить её нельзя');
        } else if (failure.kind === 'network') {
          toast.error('Нет связи с сервером. Попробуйте ещё раз');
        } else {
          toast.error('Не удалось удалить бронь');
        }
      },
    });
  };

  return (
    <>
      <Button variant="ghost-light" onClick={() => setOpen(true)}>
        <Trash2 />
        Удалить бронь
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          // Closing mid-request would hide the outcome; the request decides when we close.
          if (!deleteBooking.isPending) setOpen(next);
        }}
        title="Удалить бронь?"
        description={`${formatBookingLabel(booking)} — переговорная освободится для других.`}
        confirm={
          <Button
            variant="outline-ink"
            className="border-firecracker text-firecracker hover:bg-firecracker/10"
            onClick={confirm}
            disabled={deleteBooking.isPending}
            aria-busy={deleteBooking.isPending}
          >
            {deleteBooking.isPending ? <Spinner /> : null}
            {deleteBooking.isPending ? 'Удаляем…' : 'Удалить'}
          </Button>
        }
      />
    </>
  );
}
