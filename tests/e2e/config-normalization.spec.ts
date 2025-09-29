import { test, expect, type Page } from '@playwright/test';
import { SpecialProjectId, type AppConfig } from '@/types';

const waitForBridge = (page: Page) => page.waitForFunction(() => Boolean(window.__traceLogBridge));

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
  test('normalizes samplingRate when zero provided', async ({ page }) => {
    await page.goto('/?e2e=true');
    await waitForBridge(page);

    const config = await initTraceLog(page, { id: SpecialProjectId.Skip, samplingRate: 0 });

    expect(config?.samplingRate).toBe(1);
  });

  test('preserves custom exclusions after normalization', async ({ page }) => {
    await page.goto('/?e2e=true');
    await waitForBridge(page);

    const exclusions = ['#/blocked'];
    const config = await initTraceLog(page, {
      id: SpecialProjectId.Skip,
      samplingRate: 0,
      excludedUrlPaths: exclusions,
    });

    expect(config?.excludedUrlPaths).toEqual(exclusions);
  });
});
