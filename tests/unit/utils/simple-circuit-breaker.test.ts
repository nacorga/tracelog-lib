import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SimpleCircuitBreaker } from '@/utils/simple-circuit-breaker';

describe('SimpleCircuitBreaker', () => {
  let breaker: SimpleCircuitBreaker;

  beforeEach(() => {
    breaker = new SimpleCircuitBreaker();
  });

  test('should allow attempts initially', () => {
    expect(breaker.canAttempt()).toBe(true);
  });

  test('should track failure count', () => {
    breaker.recordFailure();
    expect(breaker.getState().failureCount).toBe(1);

    breaker.recordFailure();
    expect(breaker.getState().failureCount).toBe(2);
  });

  test('should open after max failures', () => {
    for (let i = 0; i < 5; i++) {
      breaker.recordFailure();
    }

    expect(breaker.canAttempt()).toBe(false);
    expect(breaker.getState().isOpen).toBe(true);
  });

  test('should not open before max failures', () => {
    for (let i = 0; i < 4; i++) {
      breaker.recordFailure();
    }

    expect(breaker.canAttempt()).toBe(true);
    expect(breaker.getState().isOpen).toBe(false);
  });

  test('should close after recovery delay', async () => {
    vi.useFakeTimers();

    // Open circuit
    for (let i = 0; i < 5; i++) {
      breaker.recordFailure();
    }
    expect(breaker.canAttempt()).toBe(false);

    // Advance time to recovery delay
    vi.advanceTimersByTime(30000);

    expect(breaker.canAttempt()).toBe(true);

    vi.useRealTimers();
  });

  test('should not close before recovery delay', async () => {
    vi.useFakeTimers();

    // Open circuit
    for (let i = 0; i < 5; i++) {
      breaker.recordFailure();
    }
    expect(breaker.canAttempt()).toBe(false);

    // Advance time but not enough
    vi.advanceTimersByTime(29999);

    expect(breaker.canAttempt()).toBe(false);

    vi.useRealTimers();
  });

  test('should reset on success', () => {
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.getState().failureCount).toBe(2);

    breaker.recordSuccess();
    expect(breaker.getState().failureCount).toBe(0);
    expect(breaker.getState().isOpen).toBe(false);
  });

  test('should close circuit on success even when open', () => {
    // Open circuit
    for (let i = 0; i < 5; i++) {
      breaker.recordFailure();
    }
    expect(breaker.getState().isOpen).toBe(true);

    // Record success
    breaker.recordSuccess();
    expect(breaker.getState().isOpen).toBe(false);
    expect(breaker.getState().failureCount).toBe(0);
  });

  test('should return correct state', () => {
    const initialState = breaker.getState();
    expect(initialState).toEqual({
      isOpen: false,
      failureCount: 0,
    });

    breaker.recordFailure();
    const afterFailure = breaker.getState();
    expect(afterFailure).toEqual({
      isOpen: false,
      failureCount: 1,
    });

    // Open circuit
    for (let i = 0; i < 4; i++) {
      breaker.recordFailure();
    }

    const afterOpen = breaker.getState();
    expect(afterOpen).toEqual({
      isOpen: true,
      failureCount: 5,
    });
  });
});
