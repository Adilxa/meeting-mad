import { getZonedNow } from './zoned-now';

describe('getZonedNow', () => {
  it('reads the wall clock of the given zone, not of the machine', () => {
    // 2026-10-08 20:30 UTC is already the 9th in Almaty (UTC+5).
    const at = Date.UTC(2026, 9, 8, 20, 30);
    expect(getZonedNow('UTC', at)).toEqual({ date: '2026-10-08', minutes: 20 * 60 + 30 });
    expect(getZonedNow('Asia/Almaty', at)).toEqual({ date: '2026-10-09', minutes: 1 * 60 + 30 });
  });
});
