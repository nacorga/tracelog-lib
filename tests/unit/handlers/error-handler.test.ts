import { vi, describe, expect, it, beforeEach } from 'vitest';
import { ErrorHandler } from '../../../src/handlers/error.handler';
import type { EventManager } from '../../../src/managers/event.manager';
import { Config, ErrorType, EventType } from '../../../src/types';

describe('ErrorHandler', () => {
  let handler: ErrorHandler;
  let eventManager: { track: ReturnType<typeof vi.fn> } & Partial<EventManager>;
  let config: Config;

  beforeEach(() => {
    config = { errorSampling: 1 };
    eventManager = { track: vi.fn() } as typeof eventManager;
    handler = new ErrorHandler(eventManager as unknown as EventManager);
    handler['set']('config', config);
  });

  it('should emit the error the first time and suppress duplicates within window', () => {
    const event = new ErrorEvent('error', { message: 'Boom' });

    handler['handleError'](event);
    handler['handleError'](event);

    expect(eventManager.track).toHaveBeenCalledTimes(1);
    expect(eventManager.track).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EventType.ERROR,
        error_data: expect.objectContaining({
          type: ErrorType.JS_ERROR,
          message: 'Boom',
        }),
      }),
    );
  });

  it('should allow event after suppression window expires', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

    const event = new ErrorEvent('error', { message: 'Outage' });

    handler['handleError'](event);
    expect(eventManager.track).toHaveBeenCalledTimes(1);

    // Advance time beyond suppression window (5 seconds)
    vi.advanceTimersByTime(6_000);

    handler['handleError'](event);
    expect(eventManager.track).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
