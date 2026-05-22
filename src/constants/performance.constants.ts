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
 * Default Web Vitals mode
 * 'needs-improvement' provides balanced approach - captures metrics that need attention
 * while filtering out good performance (reduces noise and costs)
 */
export const DEFAULT_WEB_VITALS_MODE: WebVitalsMode = 'needs-improvement';

/**
 * Get Web Vitals thresholds for the specified mode
 */
export const getWebVitalsThresholds = (mode: WebVitalsMode = DEFAULT_WEB_VITALS_MODE): Record<WebVitalType, number> => {
  switch (mode) {
    case 'all':
      return { LCP: 0, FCP: 0, CLS: 0, INP: 0, TTFB: 0 };
    case 'needs-improvement':
      return WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS;
    case 'poor':
      return WEB_VITALS_POOR_THRESHOLDS;
    default:
      return WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS;
  }
};

// ============================================================================
// PERFORMANCE MONITORING LIMITS
// ============================================================================

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
