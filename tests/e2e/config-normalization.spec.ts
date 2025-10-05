import { test, expect, type Page } from '@playwright/test';
import { type Config } from '@/types';
import { navigateToPlayground, ensureTraceLogBridge } from './utils/environment.utils';

const initTraceLog = async (page: Page, config: Config) => {
  return page.evaluate(async (projectConfig: Config) => {
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
    const config = await initTraceLog(page, { samplingRate: 0 });

    expect(config?.samplingRate).toBe(0); // Should preserve 0 as it's valid
  });

  test('preserves custom session timeout after normalization', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });
    await ensureTraceLogBridge(page);

    const customTimeout = 600000; // 10 minutes
    const config = await initTraceLog(page, {
      samplingRate: 0.5,
      sessionTimeout: customTimeout,
    });

    expect(config?.sessionTimeout).toBe(customTimeout);
    expect(config?.samplingRate).toBe(0.5);
  });
});
