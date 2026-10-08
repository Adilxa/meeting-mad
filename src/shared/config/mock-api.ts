/**
 * Demo-only switch understood by the mock API (src/server). With `race` the server books
 * the requested slot «for a colleague» a moment before handling the request, so the 409
 * path can be shown on demand instead of by luck. A real backend simply ignores it.
 */
export const MOCK_SCENARIO_HEADER = 'x-mock-scenario';
export const MOCK_SCENARIO_RACE = 'race';
