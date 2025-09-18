import { Page } from '@playwright/test';
import { createConsoleMonitor, navigateAndWaitForReady, initializeTraceLog } from '../common.utils';
import { Config } from '../../../src/types';
import { ConsoleMonitor } from '../../types';
import { DEFAULT_CONFIG, TEST_URLS } from '../../constants';

/**
 * Common Test Helpers and Utilities
 * Shared constants, setup functions, and utilities for event tracking tests
 */

/**
 * Setup a standard event tracking test with initialization
 */
export async function setupEventTrackingTest(
  page: Page,
  config: Config = DEFAULT_CONFIG,
  testUrl: string = TEST_URLS.INITIALIZATION_PAGE,
): Promise<{
  monitor: ConsoleMonitor;
  initResult: unknown;
}> {
  const monitor = createConsoleMonitor(page);

  await navigateAndWaitForReady(page, testUrl);
  const initResult = await initializeTraceLog(page, config);

  return { monitor, initResult };
}
