import type { Page } from '@playwright/test';

interface PlaygroundNavigationOptions {
  autoInit?: boolean;
  waitForBridge?: boolean;
  destroyExisting?: boolean;
  searchParams?: Record<string, string | boolean | number>;
  hash?: string;
}

const DEFAULT_TIMEOUT_MS = 5000;

const serializeValue = (value: string | boolean | number): string => {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  return String(value);
};

export const ensureTraceLogBridge = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => Boolean(window.__traceLogBridge), { timeout: DEFAULT_TIMEOUT_MS });
};

export const navigateToPlayground = async (page: Page, options: PlaygroundNavigationOptions = {}): Promise<void> => {
  const { autoInit = false, waitForBridge = true, destroyExisting = true, searchParams = {}, hash } = options;

  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    params.set(key, serializeValue(value));
  });

  if (!params.has('auto-init')) {
    params.set('auto-init', serializeValue(autoInit));
  }

  const query = params.toString();
  const url = `/${query ? `?${query}` : ''}${hash ?? ''}`;

  await page.goto(url);
  await page.waitForLoadState('networkidle');

  if (!waitForBridge && !destroyExisting) {
    return;
  }

  await ensureTraceLogBridge(page);

  if (destroyExisting) {
    await page.evaluate(async () => {
      if (window.__traceLogBridge?.initialized) {
        await window.__traceLogBridge.destroy();
      }
    });
  }
};
