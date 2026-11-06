import { describe, expect, it, vi } from 'vitest';

let emitOffset;
vi.mock('./firebase.js', () => ({ db: {} }));
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: (_ref, callback) => {
    emitOffset = (val) => callback({ val: () => val });
  },
}));

const { onServerOffsetChange, serverNow } = await import('./serverTime.js');
const { isOnline } = await import('./flood.js');

describe('serverNow', () => {
  it('corrects a slow device clock, so a dead sensor reads offline', () => {
    const fiveMinutes = 5 * 60_000;
    const lastReading = Date.now() - 30_000; // really stale once the clock is corrected
    vi.spyOn(Date, 'now').mockImplementation(() => lastReading + 30_000 - fiveMinutes);

    expect(isOnline(lastReading, Date.now())).toBe(true); // the bug: raw phone clock says Live
    emitOffset(fiveMinutes + 60_000);
    expect(isOnline(lastReading, serverNow())).toBe(false);

    vi.restoreAllMocks();
  });

  it('notifies listeners until they unsubscribe', () => {
    const listener = vi.fn();
    const off = onServerOffsetChange(listener);
    emitOffset(1000);
    off();
    emitOffset(2000);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('treats a missing offset as zero', () => {
    emitOffset(null);
    const before = Date.now();
    expect(serverNow()).toBeGreaterThanOrEqual(before);
    expect(serverNow()).toBeLessThan(before + 1000);
  });
});
