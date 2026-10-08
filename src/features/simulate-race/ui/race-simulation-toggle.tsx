'use client';

import { useEffect, useId, useState } from 'react';
import { setRaceSimulation } from '../model/race-simulation';

/** Demo control: makes the next save lose a race to a colleague (HTTP 409). */
export function RaceSimulationToggle() {
  const [enabled, setEnabled] = useState(false);
  const id = useId();

  useEffect(() => {
    setRaceSimulation(enabled);
    return () => setRaceSimulation(false);
  }, [enabled]);

  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={enabled}
        onChange={(event) => setEnabled(event.target.checked)}
        aria-describedby={`${id}-hint`}
        className="focus-ring mt-0.5 size-5 shrink-0 accent-ink"
      />
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="font-bold text-sm text-ink">
          Демо: коллега успевает раньше
        </label>
        <p id={`${id}-hint`} className="font-mono text-xs text-ink">
          Сервер займёт выбранный слот за миг до вашего запроса и ответит 409.
        </p>
      </div>
    </div>
  );
}
