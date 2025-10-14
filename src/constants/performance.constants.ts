/**
 * Performance monitoring and web vitals constants for TraceLog
 * Centralizes thresholds and configuration for performance tracking
 */

import { WebVitalType } from '../types';
import type { WebVitalsMode } from '../types/config.types';

// ============================================================================
// WEB VITALS THRESHOLDS
// ============================================================================

/**
 * Web Vitals "good" thresholds (75th percentile boundaries)
 * Metrics below or equal to these values are considered good performance.
 * Reference: https://web.dev/articles/vitals
 */
export const WEB_VITALS_GOOD_THRESHOLDS: Record<WebVitalType, number> = {
  LCP: 2500, // Good: ≤ 2.5s
  FCP: 1800, // Good: ≤ 1.8s
  CLS: 0.1, // Good: ≤ 0.1
  INP: 200, // Good: ≤ 200ms
  TTFB: 800, // Good: ≤ 800ms
  LONG_TASK: 50,
} as const;

/**
 * Web Vitals "needs improvement" thresholds
 * Metrics exceeding these values need attention but aren't critically poor.
 * Reference: https://web.dev/articles/vitals
 */
export const WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS: Record<WebVitalType, number> = {
  LCP: 2500, // Needs improvement: > 2.5s (same as good boundary)
  FCP: 1800, // Needs improvement: > 1.8s
  CLS: 0.1, // Needs improvement: > 0.1
  INP: 200, // Needs improvement: > 200ms
  TTFB: 800, // Needs improvement: > 800ms
  LONG_TASK: 50,
} as const;

/**
 * Web Vitals "poor" thresholds
 * Metrics exceeding these values indicate poor performance requiring immediate attention.
 * Reference: https://web.dev/articles/vitals
 */
export const WEB_VITALS_POOR_THRESHOLDS: Record<WebVitalType, number> = {
  LCP: 4000, // Poor: > 4s
  FCP: 3000, // Poor: > 3s
  CLS: 0.25, // Poor: > 0.25
  INP: 500, // Poor: > 500ms
  TTFB: 1800, // Poor: > 1800ms
  LONG_TASK: 50,
} as const;

/**
 * Default Web Vitals mode
 * 'needs-improvement' provides balanced approach - captures metrics that need attention
 * while filtering out good performance (reduces noise and costs)
 */
export const DEFAULT_WEB_VITALS_MODE: WebVitalsMode = 'needs-improvement';

/**
 * Get Web Vitals thresholds for the specified mode
 */
export function getWebVitalsThresholds(mode: WebVitalsMode = DEFAULT_WEB_VITALS_MODE): Record<WebVitalType, number> {
  switch (mode) {
    case 'all':
      return { LCP: 0, FCP: 0, CLS: 0, INP: 0, TTFB: 0, LONG_TASK: 0 }; // Track everything
    case 'needs-improvement':
      return WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS;
    case 'poor':
      return WEB_VITALS_POOR_THRESHOLDS;
    default:
      return WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS;
  }
}

// ============================================================================
// PERFORMANCE MONITORING LIMITS
// ============================================================================

/**
 * Long task throttling interval in milliseconds
 * Prevents excessive long task events from being sent
 */
export const LONG_TASK_THROTTLE_MS = 1000;

/**
 * Maximum number of navigation history entries to keep in memory
 * Prevents unbounded growth of reportedByNav Map in long-running SPAs
 * Uses FIFO eviction when limit is exceeded
 */
export const MAX_NAVIGATION_HISTORY = 50;

/**
 * Precision for performance metric values
 * All performance metrics are rounded to 2 decimal places
 */
export const PERFORMANCE_PRECISION_DECIMALS = 2 as const;
