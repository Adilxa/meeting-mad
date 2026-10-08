import { Suspense } from 'react';
import { BookingPage } from '@/pages-layer';

// «Now» is part of the render (past slots, the now-line), so the page is never prerendered.
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    // `useSearchParams` (selected date) needs a boundary.
    <Suspense>
      <BookingPage initialNow={Date.now()} />
    </Suspense>
  );
}
