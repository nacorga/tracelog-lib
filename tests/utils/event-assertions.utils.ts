import { expect } from '@playwright/test';
import { EventLogDispatch, EventCaptureStats } from '../types';
import { REGEX_PATTERNS, EVENT_VALIDATION } from '../constants';

/**
 * Specialized assertion utilities for TraceLog E2E testing
 *
 * This module provides comprehensive assertion helpers specifically designed
 * for validating TraceLog events, performance metrics, and security requirements.
 * All assertions include detailed error messages for debugging.
 *
 * @example
 * ```typescript
 * import { EventAssertions } from '../utils';
 *
 * // Assert event structure and content
 * EventAssertions.assertEventValid(event);
 * EventAssertions.assertEventHasNamespace(event, 'App');
 *
 * // Assert event sequences
 * EventAssertions.assertEventSequence(events, ['INITIALIZATION', 'SESSION_START']);
 *
 * // Assert performance metrics
 * EventAssertions.assertWebVitalsEvent(event, { lcp: { max: 2500 } });
 * ```
 */

/**
 * Expected event structure for validation
 */
export interface ExpectedEvent {
  /** Expected namespace */
  namespace?: string;
  /** Expected message content (substring or regex) */
  message?: string | RegExp;
  /** Expected log level */
  level?: string;
  /** Expected data properties */
  data?: Record<string, unknown>;
  /** Whether timestamp should be present and valid */
  hasValidTimestamp?: boolean;
}

/**
 * Event sequence validation options
 */
export interface EventSequenceOptions {
  /** Whether events must be in exact order */
  exactOrder?: boolean;
  /** Whether all events must be present */
  requireAll?: boolean;
  /** Maximum time window between events (ms) */
  maxTimeGap?: number;
  /** Allow duplicate events in sequence */
  allowDuplicates?: boolean;
}

/**
 * Performance metrics validation criteria
 */
export interface PerformanceMetricsValidation {
  /** Largest Contentful Paint validation */
  lcp?: { min?: number; max?: number };
  /** First Input Delay validation */
  fid?: { min?: number; max?: number };
  /** Cumulative Layout Shift validation */
  cls?: { min?: number; max?: number };
  /** First Contentful Paint validation */
  fcp?: { min?: number; max?: number };
  /** Time to First Byte validation */
  ttfb?: { min?: number; max?: number };
  /** Interaction to Next Paint validation */
  inp?: { min?: number; max?: number };
}

/**
 * Security validation options
 */
export interface SecurityValidationOptions {
  /** Check for PII patterns */
  checkPII?: boolean;
  /** Check for XSS patterns */
  checkXSS?: boolean;
  /** Maximum allowed data size */
  maxDataSize?: number;
  /** Allowed origins for events */
  allowedOrigins?: string[];
}

/**
 * Event data validation result
 */
export interface EventValidationResult {
  /** Whether the event is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}

/**
 * Core event structure assertions
 */
export class EventStructureAssertions {
  /**
   * Asserts that an event has the required basic structure
   */
  static assertEventValid(event: unknown, description = 'event'): asserts event is EventLogDispatch {
    expect(event, `${description} should be defined`).toBeDefined();
    expect(event, `${description} should be an object`).toBeInstanceOf(Object);

    const e = event as Partial<EventLogDispatch>;

    expect(e.timestamp, `${description} should have timestamp`).toBeDefined();
    expect(typeof e.timestamp, `${description} timestamp should be string`).toBe('string');

    expect(e.level, `${description} should have level`).toBeDefined();
    expect(typeof e.level, `${description} level should be string`).toBe('string');

    expect(e.namespace, `${description} should have namespace`).toBeDefined();
    expect(typeof e.namespace, `${description} namespace should be string`).toBe('string');

    expect(e.message, `${description} should have message`).toBeDefined();
    expect(typeof e.message, `${description} message should be string`).toBe('string');
  }

  /**
   * Asserts that an event has a valid timestamp format
   */
  static assertValidTimestamp(event: EventLogDispatch, description = 'event'): void {
    const timestampPattern = REGEX_PATTERNS.ISO_TIMESTAMP;
    expect(timestampPattern.test(event.timestamp), `${description} should have valid ISO timestamp`).toBe(true);

    const timestamp = new Date(event.timestamp);
    expect(timestamp.getTime(), `${description} timestamp should be valid date`).not.toBeNaN();

    const now = Date.now();
    const timeDiff = Math.abs(now - timestamp.getTime());
    const maxDiff = 10 * 60 * 1000; // 10 minutes

    expect(timeDiff, `${description} timestamp should be recent (within 10 minutes)`).toBeLessThan(maxDiff);
  }

  /**
   * Asserts that an event belongs to a specific namespace
   */
  static assertEventHasNamespace(event: EventLogDispatch, expectedNamespace: string, description = 'event'): void {
    expect(event.namespace, `${description} should have namespace '${expectedNamespace}'`).toBe(expectedNamespace);
  }

  /**
   * Asserts that an event message contains specific content
   */
  static assertEventMessageContains(
    event: EventLogDispatch,
    expectedContent: string | RegExp,
    description = 'event',
  ): void {
    if (expectedContent instanceof RegExp) {
      expect(event.message, `${description} message should match pattern`).toMatch(expectedContent);
    } else {
      expect(event.message, `${description} message should contain '${expectedContent}'`).toContain(expectedContent);
    }
  }

  /**
   * Asserts that an event has a specific log level
   */
  static assertEventHasLevel(event: EventLogDispatch, expectedLevel: string, description = 'event'): void {
    expect(event.level, `${description} should have level '${expectedLevel}'`).toBe(expectedLevel);
  }

  /**
   * Asserts that an event has the expected data structure
   */
  static assertEventData(event: EventLogDispatch, expectedData: Record<string, unknown>, description = 'event'): void {
    expect(event.data, `${description} should have data`).toBeDefined();

    for (const [key, expectedValue] of Object.entries(expectedData)) {
      if (event.data && typeof event.data === 'object') {
        const actualValue = (event.data as Record<string, unknown>)[key];
        expect(actualValue, `${description} data.${key} should match expected value`).toEqual(expectedValue);
      } else {
        throw new Error(`${description} data is not an object`);
      }
    }
  }
}

/**
 * Event sequence and timing assertions
 */
export class EventSequenceAssertions {
  /**
   * Asserts that events occur in a specific sequence
   */
  static assertEventSequence(
    events: EventLogDispatch[],
    expectedSequence: ExpectedEvent[],
    options: EventSequenceOptions = {},
  ): void {
    const { exactOrder = true, requireAll = true, maxTimeGap, allowDuplicates = false } = options;

    if (requireAll) {
      expect(events.length, 'Should have at least as many events as expected sequence').toBeGreaterThanOrEqual(
        expectedSequence.length,
      );
    }

    let eventIndex = 0;
    let sequenceIndex = 0;

    while (sequenceIndex < expectedSequence.length && eventIndex < events.length) {
      const expectedEvent = expectedSequence[sequenceIndex];
      const actualEvent = events[eventIndex];

      if (this.eventMatches(actualEvent, expectedEvent)) {
        // Check time gap if specified
        if (maxTimeGap && sequenceIndex > 0) {
          const prevEvent = events.find(
            (e, i) => i < eventIndex && this.eventMatches(e, expectedSequence[sequenceIndex - 1]),
          );
          if (prevEvent) {
            const timeDiff = new Date(actualEvent.timestamp).getTime() - new Date(prevEvent.timestamp).getTime();
            expect(timeDiff, `Time gap between sequence events should be within ${maxTimeGap}ms`).toBeLessThanOrEqual(
              maxTimeGap,
            );
          }
        }

        sequenceIndex++;
        if (!allowDuplicates) {
          eventIndex++;
        }
      } else if (exactOrder) {
        throw new Error(
          `Event sequence mismatch at position ${sequenceIndex}. Expected ${JSON.stringify(expectedEvent)}, got ${JSON.stringify(actualEvent)}`,
        );
      }

      if (exactOrder || this.eventMatches(actualEvent, expectedEvent)) {
        eventIndex++;
      } else {
        eventIndex++;
      }
    }

    if (requireAll && sequenceIndex < expectedSequence.length) {
      throw new Error(`Incomplete event sequence. Expected ${expectedSequence.length} events, found ${sequenceIndex}`);
    }
  }

  /**
   * Asserts that specific events are present (order doesn't matter)
   */
  static assertEventsPresent(events: EventLogDispatch[], expectedEvents: ExpectedEvent[]): void {
    for (const expectedEvent of expectedEvents) {
      const matchingEvent = events.find((event) => this.eventMatches(event, expectedEvent));
      expect(matchingEvent, `Expected event not found: ${JSON.stringify(expectedEvent)}`).toBeDefined();
    }
  }

  /**
   * Asserts that events are properly deduped
   */
  static assertNoDuplicateEvents(
    events: EventLogDispatch[],
    dedupeBy: Array<keyof EventLogDispatch> = ['namespace', 'message'],
  ): void {
    const seen = new Set<string>();
    const duplicates: EventLogDispatch[] = [];

    for (const event of events) {
      const key = dedupeBy.map((field) => event[field]).join('|');
      if (seen.has(key)) {
        duplicates.push(event);
      } else {
        seen.add(key);
      }
    }

    expect(duplicates, `Found duplicate events: ${JSON.stringify(duplicates.slice(0, 3))}`).toHaveLength(0);
  }

  /**
   * Asserts that events are ordered by timestamp
   */
  static assertEventsOrderedByTime(events: EventLogDispatch[]): void {
    for (let i = 1; i < events.length; i++) {
      const prevTime = new Date(events[i - 1].timestamp).getTime();
      const currentTime = new Date(events[i].timestamp).getTime();

      expect(currentTime, `Events should be ordered by timestamp (index ${i})`).toBeGreaterThanOrEqual(prevTime);
    }
  }

  /**
   * Helper method to check if an event matches expected criteria
   */
  private static eventMatches(event: EventLogDispatch, expected: ExpectedEvent): boolean {
    if (expected.namespace && event.namespace !== expected.namespace) {
      return false;
    }

    if (expected.level && event.level !== expected.level) {
      return false;
    }

    if (expected.message) {
      if (expected.message instanceof RegExp) {
        if (!expected.message.test(event.message)) {
          return false;
        }
      } else {
        if (!event.message.includes(expected.message)) {
          return false;
        }
      }
    }

    if (expected.hasValidTimestamp) {
      try {
        EventStructureAssertions.assertValidTimestamp(event);
      } catch {
        return false;
      }
    }

    if (expected.data && event.data) {
      for (const [key, value] of Object.entries(expected.data)) {
        if ((event.data as Record<string, unknown>)[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }
}

/**
 * Performance metrics assertions
 */
export class PerformanceAssertions {
  /**
   * Asserts that a Web Vitals event contains valid performance metrics
   */
  static assertWebVitalsEvent(event: EventLogDispatch, validation: PerformanceMetricsValidation = {}): void {
    EventStructureAssertions.assertEventValid(event, 'Web Vitals event');
    expect(event.namespace, 'Web Vitals event should have PerformanceHandler namespace').toBe('PerformanceHandler');

    if (!event.data || typeof event.data !== 'object') {
      throw new Error('Web Vitals event should have data object');
    }

    const data = event.data as Record<string, unknown>;

    // Check individual metrics based on validation criteria
    for (const [metric, criteria] of Object.entries(validation)) {
      if (data[metric] !== undefined) {
        const value = data[metric] as number;
        expect(typeof value, `${metric} should be a number`).toBe('number');
        expect(value, `${metric} should be positive`).toBeGreaterThan(0);

        if (criteria.min !== undefined) {
          expect(value, `${metric} should be at least ${criteria.min}ms`).toBeGreaterThanOrEqual(criteria.min);
        }

        if (criteria.max !== undefined) {
          expect(value, `${metric} should be at most ${criteria.max}ms`).toBeLessThanOrEqual(criteria.max);
        }
      }
    }
  }

  /**
   * Asserts that performance metrics are within acceptable ranges
   */
  static assertPerformanceWithinBounds(metrics: Record<string, number>): void {
    const bounds = {
      lcp: { max: 2500 }, // Good LCP is under 2.5s
      fid: { max: 100 }, // Good FID is under 100ms
      cls: { max: 0.1 }, // Good CLS is under 0.1
      fcp: { max: 1800 }, // Good FCP is under 1.8s
      ttfb: { max: 800 }, // Good TTFB is under 800ms
      inp: { max: 200 }, // Good INP is under 200ms
    };

    for (const [metric, value] of Object.entries(metrics)) {
      if (bounds[metric as keyof typeof bounds]) {
        const bound = bounds[metric as keyof typeof bounds];
        expect(value, `${metric.toUpperCase()} should be within acceptable range`).toBeLessThanOrEqual(bound.max);
      }
    }
  }
}

/**
 * Security and data validation assertions
 */
export class SecurityAssertions {
  /**
   * Asserts that event data doesn't contain PII
   */
  static assertNoPII(event: EventLogDispatch): void {
    const piiPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone number
    ];

    const textToCheck = [event.message, JSON.stringify(event.data ?? {})].join(' ');

    for (const pattern of piiPatterns) {
      expect(pattern.test(textToCheck), 'Event should not contain PII data').toBe(false);
    }
  }

  /**
   * Asserts that event data doesn't contain XSS patterns
   */
  static assertNoXSS(event: EventLogDispatch): void {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ];

    const textToCheck = [event.message, JSON.stringify(event.data ?? {})].join(' ');

    for (const pattern of xssPatterns) {
      expect(pattern.test(textToCheck), 'Event should not contain XSS patterns').toBe(false);
    }
  }

  /**
   * Asserts that event data size is within limits
   */
  static assertDataSizeWithinLimits(event: EventLogDispatch, maxSize: number = EVENT_VALIDATION.MAX_DATA_SIZE): void {
    const dataSize = JSON.stringify(event.data ?? {}).length;
    expect(dataSize, `Event data size should be within ${maxSize} characters`).toBeLessThanOrEqual(maxSize);

    const messageSize = event.message.length;
    expect(
      messageSize,
      `Event message size should be within ${EVENT_VALIDATION.MAX_MESSAGE_LENGTH} characters`,
    ).toBeLessThanOrEqual(EVENT_VALIDATION.MAX_MESSAGE_LENGTH);
  }

  /**
   * Validates comprehensive security criteria for an event
   */
  static validateEventSecurity(
    event: EventLogDispatch,
    options: SecurityValidationOptions = {},
  ): EventValidationResult {
    const { checkPII = true, checkXSS = true, maxDataSize = EVENT_VALIDATION.MAX_DATA_SIZE } = options;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (checkPII) {
        this.assertNoPII(event);
      }
    } catch (error) {
      errors.push(`PII detected: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      if (checkXSS) {
        this.assertNoXSS(event);
      }
    } catch (error) {
      errors.push(`XSS pattern detected: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      this.assertDataSizeWithinLimits(event, maxDataSize);
    } catch (error) {
      errors.push(`Data size exceeded: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Event statistics and analytics assertions
 */
export class StatisticsAssertions {
  /**
   * Asserts event capture statistics meet expected criteria
   */
  static assertCaptureStats(
    stats: EventCaptureStats,
    expectedCriteria: {
      minTotal?: number;
      maxTotal?: number;
      requiredNamespaces?: string[];
      requiredLevels?: string[];
    },
  ): void {
    const { minTotal, maxTotal, requiredNamespaces, requiredLevels } = expectedCriteria;

    if (minTotal !== undefined) {
      expect(stats.total, `Should have at least ${minTotal} events`).toBeGreaterThanOrEqual(minTotal);
    }

    if (maxTotal !== undefined) {
      expect(stats.total, `Should have at most ${maxTotal} events`).toBeLessThanOrEqual(maxTotal);
    }

    if (requiredNamespaces) {
      for (const namespace of requiredNamespaces) {
        expect(stats.byNamespace[namespace], `Should have events from namespace: ${namespace}`).toBeGreaterThan(0);
      }
    }

    if (requiredLevels) {
      for (const level of requiredLevels) {
        expect(stats.byLevel[level], `Should have events with level: ${level}`).toBeGreaterThan(0);
      }
    }
  }

  /**
   * Asserts that event distribution is reasonable
   */
  static assertReasonableDistribution(events: EventLogDispatch[]): void {
    const namespaceDistribution: Record<string, number> = {};
    const levelDistribution: Record<string, number> = {};

    for (const event of events) {
      namespaceDistribution[event.namespace] = (namespaceDistribution[event.namespace] || 0) + 1;
      levelDistribution[event.level] = (levelDistribution[event.level] || 0) + 1;
    }

    // Assert no single namespace dominates (more than 80% of events)
    const totalEvents = events.length;
    for (const [namespace, count] of Object.entries(namespaceDistribution)) {
      const percentage = (count / totalEvents) * 100;
      expect(percentage, `Namespace ${namespace} shouldn't dominate (${percentage.toFixed(1)}%)`).toBeLessThan(80);
    }

    // Assert we have some variety in namespaces
    expect(Object.keys(namespaceDistribution).length, 'Should have events from multiple namespaces').toBeGreaterThan(1);
  }
}

/**
 * Combined event assertions namespace
 */
export const EventAssertions = {
  // Structure assertions
  assertEventValid: EventStructureAssertions.assertEventValid,
  assertValidTimestamp: EventStructureAssertions.assertValidTimestamp,
  assertEventHasNamespace: EventStructureAssertions.assertEventHasNamespace,
  assertEventMessageContains: EventStructureAssertions.assertEventMessageContains,
  assertEventHasLevel: EventStructureAssertions.assertEventHasLevel,
  assertEventData: EventStructureAssertions.assertEventData,

  // Sequence assertions
  assertEventSequence: EventSequenceAssertions.assertEventSequence,
  assertEventsPresent: EventSequenceAssertions.assertEventsPresent,
  assertNoDuplicateEvents: EventSequenceAssertions.assertNoDuplicateEvents,
  assertEventsOrderedByTime: EventSequenceAssertions.assertEventsOrderedByTime,

  // Performance assertions
  assertWebVitalsEvent: PerformanceAssertions.assertWebVitalsEvent,
  assertPerformanceWithinBounds: PerformanceAssertions.assertPerformanceWithinBounds,

  // Security assertions
  assertNoPII: SecurityAssertions.assertNoPII,
  assertNoXSS: SecurityAssertions.assertNoXSS,
  assertDataSizeWithinLimits: SecurityAssertions.assertDataSizeWithinLimits,
  validateEventSecurity: SecurityAssertions.validateEventSecurity,

  // Statistics assertions
  assertCaptureStats: StatisticsAssertions.assertCaptureStats,
  assertReasonableDistribution: StatisticsAssertions.assertReasonableDistribution,
} as const;
