import { test, expect } from '@playwright/test';
import { BACKOFF_CONFIGS } from '../../src/constants/backoff.constants';
import { BackoffManager } from '../../src/utils/backoff.manager';

test.describe('Backoff Consistency', () => {
  test('BackoffManager should follow exponential backoff pattern', () => {
    const backoffManager = new BackoffManager(BACKOFF_CONFIGS.DEFAULT, 'Test');

    // Test initial delay
    expect(backoffManager.getCurrentDelay()).toBe(BACKOFF_CONFIGS.DEFAULT.initialDelay);
    expect(backoffManager.getAttemptCount()).toBe(0);

    // Test first delay
    const firstDelay = backoffManager.getNextDelay();
    expect(firstDelay).toBe(BACKOFF_CONFIGS.DEFAULT.initialDelay);
    expect(backoffManager.getAttemptCount()).toBe(1);

    // Test exponential growth
    const secondDelay = backoffManager.getNextDelay();
    expect(secondDelay).toBe(BACKOFF_CONFIGS.DEFAULT.initialDelay * BACKOFF_CONFIGS.DEFAULT.multiplier);
    expect(backoffManager.getAttemptCount()).toBe(2);

    // Test max delay cap
    for (let i = 0; i < 10; i++) {
      backoffManager.getNextDelay();
    }

    const finalDelay = backoffManager.getCurrentDelay();
    expect(finalDelay).toBe(BACKOFF_CONFIGS.DEFAULT.maxDelay);
  });

  test('BackoffManager should reset correctly', () => {
    const backoffManager = new BackoffManager(BACKOFF_CONFIGS.DEFAULT, 'Test');

    // Advance the backoff
    backoffManager.getNextDelay();
    backoffManager.getNextDelay();

    expect(backoffManager.getAttemptCount()).toBe(2);
    expect(backoffManager.getCurrentDelay()).toBeGreaterThan(BACKOFF_CONFIGS.DEFAULT.initialDelay);

    // Reset
    backoffManager.reset();

    expect(backoffManager.getAttemptCount()).toBe(0);
    expect(backoffManager.getCurrentDelay()).toBe(BACKOFF_CONFIGS.DEFAULT.initialDelay);
  });

  test('Circuit breaker and retry configurations should be synchronized', () => {
    const { CIRCUIT_BREAKER, RETRY } = BACKOFF_CONFIGS;

    expect(CIRCUIT_BREAKER.initialDelay).toBe(RETRY.initialDelay);
    expect(CIRCUIT_BREAKER.maxDelay).toBe(RETRY.maxDelay);
    expect(CIRCUIT_BREAKER.multiplier).toBe(RETRY.multiplier);
  });

  test('BackoffManager instances should behave independently', () => {
    const manager1 = new BackoffManager(BACKOFF_CONFIGS.CIRCUIT_BREAKER, 'Manager1');
    const manager2 = new BackoffManager(BACKOFF_CONFIGS.RETRY, 'Manager2');

    // Advance manager1
    manager1.getNextDelay();
    manager1.getNextDelay();

    // manager2 should remain at initial state
    expect(manager2.getAttemptCount()).toBe(0);
    expect(manager2.getCurrentDelay()).toBe(BACKOFF_CONFIGS.RETRY.initialDelay);

    // Reset manager1, manager2 should be unaffected
    manager1.reset();
    expect(manager1.getAttemptCount()).toBe(0);
    expect(manager2.getAttemptCount()).toBe(0);
  });

  test('BackoffManager should handle edge cases correctly', () => {
    const backoffManager = new BackoffManager(
      {
        initialDelay: 100,
        maxDelay: 200,
        multiplier: 3,
      },
      'EdgeCase',
    );

    // First delay should be initial
    expect(backoffManager.getNextDelay()).toBe(100);

    // Second delay should hit max immediately (100 * 3 = 300 > 200)
    expect(backoffManager.getNextDelay()).toBe(200);
    expect(backoffManager.getCurrentDelay()).toBe(200);

    // Should stay at max
    expect(backoffManager.getNextDelay()).toBe(200);
    expect(backoffManager.isAtMaxDelay()).toBe(true);
  });
});
