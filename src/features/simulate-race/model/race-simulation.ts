import { setDefaultHeader } from '@/shared/api';
import { MOCK_SCENARIO_HEADER, MOCK_SCENARIO_RACE } from '@/shared/config';

/**
 * Demo of rule 8 on demand: while enabled, every request asks the mock API to let a
 * «colleague» take the slot first, so the next save answers 409.
 */
export function setRaceSimulation(enabled: boolean): void {
  setDefaultHeader(MOCK_SCENARIO_HEADER, enabled ? MOCK_SCENARIO_RACE : null);
}
