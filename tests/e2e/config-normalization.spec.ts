import { test, expect, type Page } from '@playwright/test';
import { SpecialProjectId, type AppConfig } from '@/types';
import { navigateToPlayground, ensureTraceLogBridge } from './utils/environment.utils';

const initTraceLog = async (page: Page, config: AppConfig) => {
  return page.evaluate(async (projectConfig: AppConfig) => {
    const traceLog = window.__traceLogBridge!;
    await traceLog.init(projectConfig);
    const normalizedConfig = traceLog.get('config');
    await traceLog.destroy();
    return normalizedConfig;
  }, config);
};

test.describe('Config Normalization', () => {
  test('preserves valid samplingRate of zero', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });
    await ensureTraceLogBridge(page);

    // samplingRate: 0 is valid (means "don't sample any events")
    const config = await initTraceLog(page, { id: SpecialProjectId.Skip, samplingRate: 0 });

    expect(config?.samplingRate).toBe(0); // Should preserve 0 as it's valid
  });

  test('preserves custom exclusions after normalization', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });
    await ensureTraceLogBridge(page);

    const exclusions = ['#/blocked'];
    const config = await initTraceLog(page, {
      id: SpecialProjectId.Skip,
      samplingRate: 0.5, // Use valid rate
      excludedUrlPaths: exclusions,
    });

    expect(config?.excludedUrlPaths).toEqual(exclusions);
    expect(config?.samplingRate).toBe(0.5);
  });
});
