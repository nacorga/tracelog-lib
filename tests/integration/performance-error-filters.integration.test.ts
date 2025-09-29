import { describe, expect, it, beforeEach, vi } from 'vitest';
import { EventManager } from '../../src/managers/event.manager';
import { PerformanceHandler } from '../../src/handlers/performance.handler';
import { ErrorHandler } from '../../src/handlers/error.handler';
import { resetGlobalState } from '../../src/managers/state.manager';
import { EventType } from '../../src/types';

class StubEventManager extends EventManager {
  events: EventType[] = [];

  constructor() {
    super({} as any, null, null);
    this.track = vi.fn((event) => {
      this.events.push(event.type as EventType);
    }) as any;
  }
}

describe('Integration: performance and error filters', () => {
  let manager: StubEventManager;
  let performance: PerformanceHandler;
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    resetGlobalState();
    manager = new StubEventManager();
    performance = new PerformanceHandler(manager);
    errorHandler = new ErrorHandler(manager);
    performance['set']('config', {} as never);
    errorHandler['set']('config', { errorSampling: 1 });
  });

  it('should emit only significant vitals and non-duplicate errors', () => {
    performance['sendVital']({ type: 'LCP', value: 1200 });
    performance['sendVital']({ type: 'LCP', value: 4200 });
    errorHandler['handleError'](new ErrorEvent('error', { message: 'Oops' }));
    errorHandler['handleError'](new ErrorEvent('error', { message: 'Oops' }));

    expect(manager.events).toEqual([EventType.WEB_VITALS, EventType.ERROR]);
  });
});
