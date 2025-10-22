/**
 * Error Sampling Rate Unit Tests
 *
 * Tests probabilistic sampling of error events to detect library defects:
 * - errorSampling: 0.3 captures ~30% of errors
 * - errorSampling: 0 captures no errors
 * - errorSampling: 1 captures all errors
 * - Sampling respects configured rate
 *
 * Focus: Detect error sampling defects and configuration issues
 */

import { vi, describe, expect, it, beforeEach, afterEach } from 'vitest';
import { ErrorHandler } from '../../src/handlers/error.handler';
import type { EventManager } from '../../src/managers/event.manager';
import { Config, EventType } from '../../src/types';

describe('Error Sampling Rate', () => {
  let handler: ErrorHandler;
  let eventManager: { track: ReturnType<typeof vi.fn> } & Partial<EventManager>;
  let config: Config;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should sample ~30% of errors with errorSampling: 0.3', () => {
    config = { errorSampling: 0.3 };
    eventManager = { track: vi.fn() } as typeof eventManager;
    handler = new ErrorHandler(eventManager as unknown as EventManager);
    handler['set']('config', config);

    // Mock Math.random to return predictable values
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      // First 3 calls return 0.2 (< 0.3), next 7 return 0.5 (>= 0.3)
      return callCount <= 3 ? 0.2 : 0.5;
    });

    // Generate 10 errors
    for (let i = 0; i < 10; i++) {
      const event = new ErrorEvent('error', { message: `Error ${i}` });
      handler['handleError'](event);
    }

    // Should have captured ~3 errors (30% of 10)
    expect(eventManager.track).toHaveBeenCalledTimes(3);
  });

  it('should sample 0% of errors with errorSampling: 0', () => {
    config = { errorSampling: 0 };
    eventManager = { track: vi.fn() } as typeof eventManager;
    handler = new ErrorHandler(eventManager as unknown as EventManager);
    handler['set']('config', config);

    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    // Generate 10 errors
    for (let i = 0; i < 10; i++) {
      const event = new ErrorEvent('error', { message: `Error ${i}` });
      handler['handleError'](event);
    }

    // Should capture NO errors
    expect(eventManager.track).toHaveBeenCalledTimes(0);
  });

  it('should sample 100% of errors with errorSampling: 1', () => {
    config = { errorSampling: 1 };
    eventManager = { track: vi.fn() } as typeof eventManager;
    handler = new ErrorHandler(eventManager as unknown as EventManager);
    handler['set']('config', config);

    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    // Generate 10 errors (all unique to avoid deduplication)
    for (let i = 0; i < 10; i++) {
      const event = new ErrorEvent('error', { message: `Unique Error ${i}` });
      handler['handleError'](event);
    }

    // Should capture ALL errors
    expect(eventManager.track).toHaveBeenCalledTimes(10);
  });

  it('should sample ~50% of errors with errorSampling: 0.5', () => {
    config = { errorSampling: 0.5 };
    eventManager = { track: vi.fn() } as typeof eventManager;
    handler = new ErrorHandler(eventManager as unknown as EventManager);
    handler['set']('config', config);

    // Mock Math.random: first 5 sampled, next 5 not
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      return callCount <= 5 ? 0.3 : 0.7;
    });

    // Generate 10 unique errors
    for (let i = 0; i < 10; i++) {
      const event = new ErrorEvent('error', { message: `Error ${i}` });
      handler['handleError'](event);
    }

    // Should have captured ~5 errors (50% of 10)
    expect(eventManager.track).toHaveBeenCalledTimes(5);
  });

  it('should respect sampling across different error types', () => {
    config = { errorSampling: 0.5 };
    eventManager = { track: vi.fn() } as typeof eventManager;
    handler = new ErrorHandler(eventManager as unknown as EventManager);
    handler['set']('config', config);

    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      return callCount % 2 === 1 ? 0.3 : 0.7; // Alternate sampled/not sampled
    });

    // Generate different types of errors
    const errorEvent = new ErrorEvent('error', { message: 'JS Error' });
    handler['handleError'](errorEvent);

    // Create rejected promise with catch to avoid unhandled rejection
    const rejectedPromise = Promise.reject('Promise error');
    rejectedPromise.catch(() => {
      // Prevent unhandled rejection in tests
    });

    const promiseError = new PromiseRejectionEvent('unhandledrejection', {
      promise: rejectedPromise,
      reason: 'Promise error',
    });
    handler['handleRejection'](promiseError);

    const anotherError = new ErrorEvent('error', { message: 'Another JS Error' });
    handler['handleError'](anotherError);

    // Should have sampled 2 of 3 (alternating pattern)
    expect(eventManager.track).toHaveBeenCalledTimes(2);

    // Verify both sampled events are ERROR type
    const calls = (eventManager.track as ReturnType<typeof vi.fn>).mock.calls;
    calls.forEach((call) => {
      expect(call[0].type).toBe(EventType.ERROR);
    });
  });

  it('should apply sampling independently per error instance', () => {
    config = { errorSampling: 0.5 };
    eventManager = { track: vi.fn() } as typeof eventManager;
    handler = new ErrorHandler(eventManager as unknown as EventManager);
    handler['set']('config', config);

    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      return callCount === 1 || callCount === 3 ? 0.3 : 0.7;
    });

    // Generate 3 unique errors
    for (let i = 0; i < 3; i++) {
      const event = new ErrorEvent('error', { message: `Independent Error ${i}` });
      handler['handleError'](event);
    }

    // Should sample 1st and 3rd errors (based on mock)
    expect(eventManager.track).toHaveBeenCalledTimes(2);
  });
});
