/**
 * Performance monitoring and web vitals constants for TraceLog
 * Centralizes thresholds and configuration for performance tracking
 */

import { WebVitalType } from '../types';

// ============================================================================
// WEB VITALS THRESHOLDS
// ============================================================================

/**
 * Web Vitals thresholds in milliseconds (except CLS which is unitless)
 * These define the minimum values required to report a web vital metric
 *
 * Based on Core Web Vitals standards:
 * - LCP (Largest Contentful Paint): 4000ms threshold (poor threshold)
 * - FCP (First Contentful Paint): 1800ms threshold (good threshold)
 * - CLS (Cumulative Layout Shift): 0.25 threshold (unitless, needs improvement threshold)
 * - INP (Interaction to Next Paint): 200ms threshold (good threshold)
 *   TTFB (Time to First Byte): 800ms threshold (good/needs improvement boundary, aligned with Web Vitals standard)
 * - LONG_TASK: 50ms threshold for long task detection
 */
export const WEB_VITALS_THRESHOLDS: Record<WebVitalType, number> = {
  LCP: 4000,
  FCP: 1800,
  CLS: 0.25,
  INP: 200,
  TTFB: 800,
  LONG_TASK: 50,
} as const;

// ============================================================================
// PERFORMANCE MONITORING LIMITS
// ============================================================================

/**
 * Long task throttling interval in milliseconds
 * Prevents excessive long task events from being sent
 */
export const LONG_TASK_THROTTLE_MS = 1000;

/**
 * Precision for performance metric values
 * All performance metrics are rounded to 2 decimal places
 */
export const PERFORMANCE_PRECISION_DECIMALS = 2 as const;
