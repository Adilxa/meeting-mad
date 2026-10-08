'use client';

import { Alert, Button } from '@/shared/ui';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl items-center px-4">
      <Alert
        tone="error"
        title="Что-то сломалось"
        action={
          <Button variant="outline-ink" size="sm" onClick={reset}>
            Перезагрузить
          </Button>
        }
      >
        Мы уже не можем показать эту страницу. Попробуйте ещё раз.
      </Alert>
    </main>
  );
}
