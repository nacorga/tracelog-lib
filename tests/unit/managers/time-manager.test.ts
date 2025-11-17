/**
 * TimeManager Tests
 * Focus: Accurate timestamp generation with clock skew protection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { TimeManager } from '../../../src/managers/time.manager';

describe('TimeManager - Timestamp Generation', () => {
  let timeManager: TimeManager;

  beforeEach(() => {
    setupTestEnvironment();
    timeManager = new TimeManager();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    vi.restoreAllMocks();
  });

  it('should initialize with boot time reference', () => {
    const bootInfo = timeManager.getBootInfo();

    expect(bootInfo.bootTime).toBeGreaterThanOrEqual(0);
    expect(bootInfo.bootTimestamp).toBeGreaterThan(0);
    expect(bootInfo.hasPerformanceNow).toBe(true);
    expect(Math.abs(bootInfo.clockSkew)).toBeLessThan(10);
  });

  it('should generate timestamps using monotonic clock', () => {
    const timestamp1 = timeManager.now();
    const timestamp2 = timeManager.now();

    expect(timestamp1).toBeGreaterThan(0);
    expect(timestamp2).toBeGreaterThanOrEqual(timestamp1);
    expect(Math.abs(timestamp2 - timestamp1)).toBeLessThan(100); // Should be very close
  });

  it('should generate increasing timestamps over time', async () => {
    const timestamp1 = timeManager.now();

    // Wait 50ms
    await new Promise((resolve) => setTimeout(resolve, 50));

    const timestamp2 = timeManager.now();

    expect(timestamp2).toBeGreaterThan(timestamp1);
    expect(timestamp2 - timestamp1).toBeGreaterThanOrEqual(45); // Allow some variance
    expect(timestamp2 - timestamp1).toBeLessThan(100); // But not too much
  });

  it('should be immune to Date.now() changes during session', () => {
    const timestamp1 = timeManager.now();

    // Mock Date.now() to simulate system clock jumping forward by 5 minutes
    const originalDateNow = Date.now;
    const fiveMinutes = 5 * 60 * 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => originalDateNow() + fiveMinutes);

    const timestamp2 = timeManager.now();

    // Timestamps should still be accurate (not affected by Date.now() jump)
    const diff = timestamp2 - timestamp1;
    expect(diff).toBeLessThan(100); // Should still be close, not 5 minutes apart

    vi.restoreAllMocks();
  });

  it('should return milliseconds since epoch', () => {
    const timestamp = timeManager.now();
    const now = Date.now();

    // Should be within 1 second of Date.now()
    expect(Math.abs(timestamp - now)).toBeLessThan(1000);
  });
});

describe('TimeManager - Clock Skew Detection', () => {
  let timeManager: TimeManager;

  beforeEach(() => {
    setupTestEnvironment();
    timeManager = new TimeManager();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    vi.restoreAllMocks();
  });

  it('should detect no skew initially', () => {
    const skew = timeManager.getClockSkew();

    expect(Math.abs(skew)).toBeLessThan(1000); // Less than 1 second tolerance
  });

  it('should detect clock skew when system clock changes', async () => {
    // Initial check
    const initialSkew = timeManager.getClockSkew();
    expect(Math.abs(initialSkew)).toBeLessThan(1000);

    // Wait for throttle to expire (5+ seconds)
    await new Promise((resolve) => setTimeout(resolve, 5100));

    // Mock Date.now() to simulate system clock jumping forward by 2 minutes
    const originalDateNow = Date.now;
    const twoMinutes = 2 * 60 * 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => originalDateNow() + twoMinutes);

    const skewAfterJump = timeManager.getClockSkew();

    // Should detect ~2 minutes of skew
    expect(skewAfterJump).toBeGreaterThan(100000); // > 100 seconds
    expect(skewAfterJump).toBeLessThan(140000); // < 140 seconds (allowing some variance)

    vi.restoreAllMocks();
  }, 10000); // 10 second timeout for this long-running test

  it('should throttle skew checks to every 5 seconds', () => {
    const skew1 = timeManager.getClockSkew();
    const skew2 = timeManager.getClockSkew();
    const skew3 = timeManager.getClockSkew();

    // All should return the same cached value (no recalculation)
    expect(skew2).toBe(skew1);
    expect(skew3).toBe(skew1);
  });

  it('should return zero skew when performance.now() unavailable', () => {
    // Mock performance.now() as undefined
    const originalPerformance = global.performance;
    // @ts-expect-error - Intentionally setting to undefined for test
    global.performance = undefined;

    const timeManagerWithoutPerformance = new TimeManager();
    const skew = timeManagerWithoutPerformance.getClockSkew();

    expect(skew).toBe(0);

    // Restore
    global.performance = originalPerformance;
  });
});

describe('TimeManager - Timestamp Validation', () => {
  let timeManager: TimeManager;

  beforeEach(() => {
    setupTestEnvironment();
    timeManager = new TimeManager();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should validate current timestamps as valid', () => {
    const timestamp = timeManager.now();
    const validation = timeManager.validateTimestamp(timestamp);

    expect(validation.valid).toBe(true);
    expect(validation.error).toBeUndefined();
  });

  it('should validate recent past timestamps as valid', () => {
    const oneMinuteAgo = timeManager.now() - 60 * 1000;
    const validation = timeManager.validateTimestamp(oneMinuteAgo);

    expect(validation.valid).toBe(true);
    expect(validation.error).toBeUndefined();
  });

  it('should reject timestamps >2 minutes in the future', () => {
    const threeMinutesFuture = timeManager.now() + 3 * 60 * 1000;
    const validation = timeManager.validateTimestamp(threeMinutesFuture);

    expect(validation.valid).toBe(false);
    expect(validation.error).toBeDefined();
    expect(validation.error).toContain('in the future');
    expect(validation.error).toContain('3.00 minutes');
  });

  it('should accept timestamps exactly 2 minutes in the future', () => {
    const twoMinutesFuture = timeManager.now() + 2 * 60 * 1000;
    const validation = timeManager.validateTimestamp(twoMinutesFuture);

    expect(validation.valid).toBe(true);
    expect(validation.error).toBeUndefined();
  });

  it('should accept timestamps slightly under 2 minutes in the future', () => {
    const almostTwoMinutes = timeManager.now() + (2 * 60 * 1000 - 1000);
    const validation = timeManager.validateTimestamp(almostTwoMinutes);

    expect(validation.valid).toBe(true);
    expect(validation.error).toBeUndefined();
  });
});

describe('TimeManager - Fallback Behavior', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    vi.restoreAllMocks();
  });

  it('should fallback to Date.now() when performance.now() unavailable', () => {
    // Mock performance.now() as undefined
    const originalPerformance = global.performance;
    // @ts-expect-error - Intentionally setting to undefined for test
    global.performance = undefined;

    const timeManagerWithoutPerformance = new TimeManager();
    const timestamp = timeManagerWithoutPerformance.now();
    const now = Date.now();

    // Should use Date.now() as fallback
    expect(Math.abs(timestamp - now)).toBeLessThan(100);

    const bootInfo = timeManagerWithoutPerformance.getBootInfo();
    expect(bootInfo.hasPerformanceNow).toBe(false);
    expect(bootInfo.bootTime).toBe(0);

    // Restore
    global.performance = originalPerformance;
  });

  it('should still generate valid timestamps in fallback mode', () => {
    // Mock performance.now() as undefined
    const originalPerformance = global.performance;
    // @ts-expect-error - Intentionally setting to undefined for test
    global.performance = undefined;

    const timeManagerWithoutPerformance = new TimeManager();
    const timestamp1 = timeManagerWithoutPerformance.now();
    const timestamp2 = timeManagerWithoutPerformance.now();

    expect(timestamp1).toBeGreaterThan(0);
    expect(timestamp2).toBeGreaterThanOrEqual(timestamp1);

    // Restore
    global.performance = originalPerformance;
  });
});

describe('TimeManager - Boot Info', () => {
  let timeManager: TimeManager;

  beforeEach(() => {
    setupTestEnvironment();
    timeManager = new TimeManager();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should provide complete boot information', () => {
    const bootInfo = timeManager.getBootInfo();

    expect(bootInfo).toHaveProperty('bootTime');
    expect(bootInfo).toHaveProperty('bootTimestamp');
    expect(bootInfo).toHaveProperty('hasPerformanceNow');
    expect(bootInfo).toHaveProperty('clockSkew');

    expect(typeof bootInfo.bootTime).toBe('number');
    expect(typeof bootInfo.bootTimestamp).toBe('number');
    expect(typeof bootInfo.hasPerformanceNow).toBe('boolean');
    expect(typeof bootInfo.clockSkew).toBe('number');
  });

  it('should have consistent boot timestamp on subsequent calls', () => {
    const bootInfo1 = timeManager.getBootInfo();
    const bootInfo2 = timeManager.getBootInfo();

    expect(bootInfo2.bootTime).toBe(bootInfo1.bootTime);
    expect(bootInfo2.bootTimestamp).toBe(bootInfo1.bootTimestamp);
    expect(bootInfo2.hasPerformanceNow).toBe(bootInfo1.hasPerformanceNow);
  });
});
