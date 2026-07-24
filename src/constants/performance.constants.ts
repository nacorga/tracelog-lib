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
 * Reference: https://web.dev/articles/vitals
 */
export const WEB_VITALS_GOOD_THRESHOLDS: Record<WebVitalType, number> = {
  LCP: 2500,
  FCP: 1800,
  CLS: 0.1,
  INP: 200,
  TTFB: 800,
} as const;

/**
 * Web Vitals "needs improvement" thresholds
 */
export const WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS: Record<WebVitalType, number> = {
  LCP: 2500,
  FCP: 1800,
  CLS: 0.1,
  INP: 200,
  TTFB: 800,
} as const;

/**
 * Web Vitals "poor" thresholds
 */
export const WEB_VITALS_POOR_THRESHOLDS: Record<WebVitalType, number> = {
  LCP: 4000,
  FCP: 3000,
  CLS: 0.25,
  INP: 500,
  TTFB: 1800,
} as const;

/**
 * Web Vitals thresholds for 'all' mode: no floor at all.
 *
 * `-Infinity` rather than `0` so "keep everything" is expressed as an actual
 * absence of a floor. With `0` the mode depended on the comparison being
 * exclusive, which silently dropped the legitimate zero values ('all' must keep
 * a CLS of exactly `0`, and a TTFB of exactly `0` on a Mobile Safari cached
 * response) and forced the narrowing modes to use the same exclusive
 * comparison — reporting an LCP of exactly 2500 ms as needing improvement when
 * web.dev classifies it as good.
 */
export const WEB_VITALS_ALL_THRESHOLDS: Record<WebVitalType, number> = {
  LCP: Number.NEGATIVE_INFINITY,
  FCP: Number.NEGATIVE_INFINITY,
  CLS: Number.NEGATIVE_INFINITY,
  INP: Number.NEGATIVE_INFINITY,
  TTFB: Number.NEGATIVE_INFINITY,
} as const;

/**
 * Default Web Vitals mode
 *
 * 'all' captures every measured metric, including good ones. Filtering to
 * 'needs-improvement'/'poor' censors the sample at source: the server can no
 * longer tell a truncated sample from a complete one, and every derived
 * statistic (p75, good/needs-improvement/poor split) becomes conditional on
 * "given the metric was already bad". Consolidation (one event per
 * navigation, see `PerformanceHandler`) is what keeps capturing everything
 * affordable.
 */
export const DEFAULT_WEB_VITALS_MODE: WebVitalsMode = 'all';

/**
 * Get Web Vitals thresholds for the specified mode.
 *
 * An unrecognized mode falls back to `DEFAULT_WEB_VITALS_MODE`'s thresholds:
 * bad input must never silently censor the sample.
 */
export const getWebVitalsThresholds = (mode: WebVitalsMode = DEFAULT_WEB_VITALS_MODE): Record<WebVitalType, number> => {
  switch (mode) {
    case 'all':
      return WEB_VITALS_ALL_THRESHOLDS;
    case 'needs-improvement':
      return WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS;
    case 'poor':
      return WEB_VITALS_POOR_THRESHOLDS;
    default:
      return WEB_VITALS_ALL_THRESHOLDS;
  }
};

// ============================================================================
// PERFORMANCE MONITORING LIMITS
// ============================================================================

/**
 * Maximum number of navigation history entries to keep in memory
 * Prevents unbounded growth of the seen-navigation set in long-running SPAs
 * Uses FIFO eviction when limit is exceeded
 */
export const MAX_NAVIGATION_HISTORY = 50;

/**
 * Precision for performance metric values
 * All performance metrics are rounded to 2 decimal places
 */
export const PERFORMANCE_PRECISION_DECIMALS = 2 as const;
