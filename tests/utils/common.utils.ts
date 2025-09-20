import { ConsoleMessage, Page } from '@playwright/test';
import { ConsoleMonitor } from '../types';
import { DEFAULT_CONFIG, TEST_URLS } from '../constants';
import { Config, TraceLogTestBridge } from '../../src/types';

/**
 * Core shared utilities for TraceLog E2E tests
 * This file contains all common functionality that can be reused across different test domains.
 */

export function getAppInstance(page: Page): Promise<TraceLogTestBridge | null> {
  return page.evaluate(() => {
    return window.__traceLogTestBridge ?? null;
  });
}

/**
 * Console message monitoring utilities
 */
export function createConsoleMonitor(page: Page): ConsoleMonitor {
  const consoleMessages: string[] = [];
  const traceLogErrors: string[] = [];
  const traceLogWarnings: string[] = [];
  const traceLogInfo: string[] = [];
  const debugLogs: string[] = [];
  const contextErrors: string[] = [];

  const monitor = (msg: ConsoleMessage): void => {
    const text = msg.text();
    const type = msg.type();

    consoleMessages.push(text);

    if (text.includes('[TraceLog:')) {
      debugLogs.push(`[${type.toUpperCase()}] ${text}`);

      if (type === 'error') {
        traceLogErrors.push(text);
      } else if (type === 'warning') {
        traceLogWarnings.push(text);
      } else if (type === 'info' || type === 'log') {
        traceLogInfo.push(text);
      }
    } else if (type === 'error') {
      contextErrors.push(text);
    }
  };

  const getAnomalies = (): string[] => {
    const anomalies: string[] = [];

    // Check for TraceLog-specific errors first (most important)
    if (traceLogErrors.length > 0) {
      anomalies.push(`TraceLog errors detected: ${traceLogErrors.length} error(s)`);
    }

    // Check for context errors (potentially related)
    if (contextErrors.length > 0) {
      anomalies.push(`Context errors detected: ${contextErrors.length} error(s)`);
    }

    // Check for excessive warnings
    if (traceLogWarnings.length > 10) {
      anomalies.push(`High warning count: ${traceLogWarnings.length} warnings (threshold: 10)`);
    }

    // Simple pattern detection for common issues
    const problemPatterns = [
      { pattern: 'failed', threshold: 3, name: 'failures' },
      { pattern: 'error', threshold: 5, name: 'error mentions' },
      { pattern: 'timeout', threshold: 2, name: 'timeouts' },
      { pattern: 'retry', threshold: 5, name: 'retries' },
    ];

    problemPatterns.forEach(({ pattern, threshold, name }) => {
      const matchingLogs = debugLogs.filter((log) => log.toLowerCase().includes(pattern.toLowerCase()));

      if (matchingLogs.length > threshold) {
        anomalies.push(`Excessive ${name}: ${matchingLogs.length} occurrences (threshold: ${threshold})`);
      }
    });

    return anomalies;
  };

  page.on('console', monitor);

  return {
    consoleMessages,
    traceLogErrors,
    traceLogWarnings,
    traceLogInfo,
    debugLogs,
    contextErrors,
    cleanup: () => page.off('console', monitor),
    getAnomalies,
  };
}

/**
 * Page navigation and initialization utilities
 */
export async function navigateAndWaitForReady(
  page: Page,
  url: string = TEST_URLS.INITIALIZATION_PAGE,
  statusSelector?: string,
): Promise<void> {
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');

  // Wait for either init-status or validation-status depending on the page
  const selector = statusSelector ?? '[data-testid="init-status"], [data-testid="validation-status"]';
  await page.locator(selector).waitFor();
}

export async function initializeTraceLog(
  page: Page,
  config: Config = DEFAULT_CONFIG,
): Promise<{ success: boolean; error: unknown }> {
  return await page.evaluate(async (config) => {
    try {
      await window.__traceLogTestBridge?.init(config);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error };
    }
  }, config);
}

export function verifyInitializationResult(result: unknown): { success: boolean; error: unknown; hasError: boolean } {
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid initialization result structure');
  }

  const typedResult = result as { success?: unknown; error?: unknown };

  return {
    success: typedResult.success === true,
    error: typedResult.error,
    hasError: typedResult.error !== null && typedResult.error !== undefined,
  };
}

export function verifyNoTraceLogErrors(traceLogErrors: string[]): boolean {
  return traceLogErrors.length === 0;
}
