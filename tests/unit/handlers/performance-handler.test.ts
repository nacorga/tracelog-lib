import { describe, expect, it, beforeEach, vi } from 'vitest';
import { PerformanceHandler } from '../../../src/handlers/performance.handler';
import type { EventManager } from '../../../src/managers/event.manager';

describe('PerformanceHandler', () => {
  let handler: PerformanceHandler;
  let trackSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handler = new PerformanceHandler({ track: vi.fn() } as unknown as EventManager);
    trackSpy = handler['eventManager'].track as ReturnType<typeof vi.fn>;
    handler['set']('config', {} as never);
  });

  it('should skip web vitals below threshold', () => {
    handler['sendVital']({ type: 'LCP', value: 1000 });
    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('should emit web vitals above threshold', () => {
    handler['sendVital']({ type: 'LCP', value: 5000 });
    expect(trackSpy).toHaveBeenCalledTimes(1);
  });
});
