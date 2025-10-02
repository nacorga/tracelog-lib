/**
 * ErrorHandler Memory Leak Test
 *
 * Tests that the error tracking map doesn't grow indefinitely
 * Critical bug: Apps with many unique errors could exhaust memory
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorHandler } from '@/handlers/error.handler';
import { EventManager } from '@/managers/event.manager';
import { StorageManager } from '@/managers/storage.manager';
import { MAX_TRACKED_ERRORS_HARD_LIMIT } from '@/constants/error.constants';

describe('ErrorHandler - Memory Leak Prevention', () => {
  let errorHandler: ErrorHandler;
  let eventManager: EventManager;
  let storageManager: StorageManager;

  beforeEach(() => {
    vi.clearAllMocks();

    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
    errorHandler = new ErrorHandler(eventManager);

    // Mock state to enable error tracking
    vi.spyOn(errorHandler as any, 'get').mockImplementation((key: unknown) => {
      if (key === 'config') return { id: 'test-project', errorSampling: 1 }; // 100% sampling for tests
      if (key === 'sessionId') return 'session-123';
      return null;
    });

    // Mock event tracking
    vi.spyOn(eventManager, 'track').mockImplementation(() => {});
  });

  afterEach(() => {
    errorHandler.stopTracking();
    vi.restoreAllMocks();
  });

  it('should enforce hard limit on tracked errors to prevent memory exhaustion', () => {
    errorHandler.startTracking();

    // Generate more errors than the hard limit (100)
    for (let i = 0; i < MAX_TRACKED_ERRORS_HARD_LIMIT + 50; i++) {
      const errorEvent = new ErrorEvent('error', {
        message: `Unique error ${i}`,
        filename: 'test.js',
        lineno: i,
      });

      errorHandler['handleError'](errorEvent);
    }

    // Verify Map size doesn't exceed hard limit
    const mapSize = errorHandler['recentErrors'].size;
    expect(mapSize).toBeLessThanOrEqual(MAX_TRACKED_ERRORS_HARD_LIMIT);
  });

  it('should maintain functionality after hitting hard limit', () => {
    errorHandler.startTracking();

    // Exhaust the hard limit
    for (let i = 0; i < MAX_TRACKED_ERRORS_HARD_LIMIT + 20; i++) {
      const errorEvent = new ErrorEvent('error', {
        message: `Error ${i}`,
      });

      errorHandler['handleError'](errorEvent);
    }

    // New errors should still be tracked
    const trackSpy = vi.spyOn(eventManager, 'track');

    const newError = new ErrorEvent('error', {
      message: 'New error after limit',
    });

    errorHandler['handleError'](newError);

    expect(trackSpy).toHaveBeenCalled();
  });

  it('should handle rapid succession of unique errors without crashing', () => {
    errorHandler.startTracking();

    // Simulate a loop generating many unique errors
    const generateUniqueErrors = (): void => {
      for (let i = 0; i < 200; i++) {
        const errorEvent = new ErrorEvent('error', {
          message: `Rapid error ${i}-${Date.now()}`,
        });

        errorHandler['handleError'](errorEvent);
      }
    };

    // Should not throw
    expect(generateUniqueErrors).not.toThrow();

    // Verify map size is controlled
    const mapSize = errorHandler['recentErrors'].size;
    expect(mapSize).toBeLessThanOrEqual(MAX_TRACKED_ERRORS_HARD_LIMIT);
  });

  it('should properly clean up on stopTracking', () => {
    errorHandler.startTracking();

    // Add some errors
    for (let i = 0; i < 20; i++) {
      const errorEvent = new ErrorEvent('error', {
        message: `Error ${i}`,
      });

      errorHandler['handleError'](errorEvent);
    }

    expect(errorHandler['recentErrors'].size).toBeGreaterThan(0);

    // Stop tracking should clear the map
    errorHandler.stopTracking();

    expect(errorHandler['recentErrors'].size).toBe(0);
  });

  it('should deduplicate errors correctly even after pruning', () => {
    errorHandler.startTracking();

    const trackSpy = vi.spyOn(eventManager, 'track');

    // Generate errors up to soft limit
    for (let i = 0; i < 60; i++) {
      const errorEvent = new ErrorEvent('error', {
        message: `Error ${i}`,
      });

      errorHandler['handleError'](errorEvent);
    }

    trackSpy.mockClear();

    // Send duplicate error (should be suppressed)
    const duplicateError = new ErrorEvent('error', {
      message: 'Error 10', // Same as one sent before
    });

    errorHandler['handleError'](duplicateError);

    // Should be suppressed (not tracked again)
    expect(trackSpy).not.toHaveBeenCalled();
  });
});
