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
  // CSP-safe: Use page.evaluate with internal wait instead of page.waitForFunction
  const bridgeAvailable = await page.evaluate(async (timeoutMs) => {
    let retries = 0;
    const intervalMs = 100;
    const maxRetries = Math.ceil(timeoutMs / intervalMs);

    while (!window.__traceLogBridge && retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      retries++;
    }

    return Boolean(window.__traceLogBridge);
  }, DEFAULT_TIMEOUT_MS);

  if (!bridgeAvailable) {
    throw new Error(`TraceLog bridge not available after ${DEFAULT_TIMEOUT_MS}ms`);
  }
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
    await page.evaluate(() => {
      if (window.__traceLogBridge?.initialized) {
        window.__traceLogBridge.destroy();
      }
    });
  }
};
