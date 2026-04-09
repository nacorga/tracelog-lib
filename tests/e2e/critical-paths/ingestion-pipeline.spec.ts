import { test, expect, type Page } from '@playwright/test';
import { INGESTION_TEST_ORIGIN } from '../../../../testing/ingestion/fixtures';
import { startIngestionStack, type IngestionStack } from '../helpers/ingestion-stack.helper';

const pageUrl = `${INGESTION_TEST_ORIGIN}/?auto-init=false`;

async function waitForBridge(page: Page): Promise<void> {
  await page.evaluate(async () => {
    let retries = 0;
    while (!window.__traceLogBridge && retries < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      retries++;
    }

    if (!window.__traceLogBridge) {
      throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
    }
  });
}

async function initAgainstMiddleware(
  page: Page,
  collectApiUrl: string,
  overrides: Record<string, unknown> = {},
): Promise<void> {
  await waitForBridge(page);
  await page.evaluate(
    async ({ url, configOverrides }) => {
      const bridge = window.__traceLogBridge;
      if (!bridge) {
        throw new Error('TraceLog bridge not available');
      }

      bridge.destroy(true);
      await bridge.init({
        sendIntervalMs: 200,
        ...configOverrides,
        integrations: {
          custom: {
            collectApiUrl: url,
            allowHttp: true,
            fetchCredentials: 'omit',
          },
        },
      });
    },
    { url: collectApiUrl, configOverrides: overrides },
  );
}

function captureCollectRequestIds(page: Page, collectApiUrl: string): string[] {
  const requestIds: string[] = [];

  page.on('response', async (response) => {
    if (response.url() !== collectApiUrl || response.request().method() !== 'POST') {
      return;
    }

    requestIds.push(response.headers()['x-request-id'] ?? '');
  });

  return requestIds;
}

test.describe('E2E: Ingestion Pipeline', () => {
  test.describe.configure({ mode: 'serial' });

  let stack: IngestionStack;

  test.beforeAll(async () => {
    stack = await startIngestionStack();
  });

  test.afterAll(async () => {
    if (stack) {
      await stack.stop();
    }
  });

  test.beforeEach(async ({ page }) => {
    await stack.reset();
    await page.goto(pageUrl);
  });

  test('should ingest SESSION_START and PAGE_VIEW exactly once through middleware', async ({ page }) => {
    const collectRequestIds = captureCollectRequestIds(page, stack.middlewareCollectUrl);
    await initAgainstMiddleware(page, stack.middlewareCollectUrl);

    await expect
      .poll(async () => (await stack.getApiState()).events.length, {
        message: 'events should reach API through middleware',
      })
      .toBe(2);

    const state = await stack.getApiState();
    expect(state.events.map((event) => event.type)).toEqual(['session_start', 'page_view']);
    expect(state.events.every((event) => event.ingestion_path === 'middleware')).toBe(true);
    expect(state.events.every((event) => event.source?.startsWith(INGESTION_TEST_ORIGIN))).toBe(true);
    expect(state.sessionsCount).toBe(1);
    expect(state.visitorsCount).toBe(1);
    expect(state.sessions[0]?.location).toEqual({ country: 'Local Test', country_code: 'TEST' });
    expect(state.visitors[0]?.first_location).toEqual({ country: 'Local Test', country_code: 'TEST' });
    expect(state.capturedRequests).toHaveLength(1);
    expect(state.capturedRequests[0]?.events?.map((event) => event.type)).toEqual(['session_start', 'page_view']);
    expect(collectRequestIds).toHaveLength(1);
    expect(collectRequestIds[0]).toBe(state.capturedRequests[0]?.request_id);
  });

  test('should preserve idempotency after a client timeout and mutated retry', async ({ page }) => {
    await stack.configureMiddleware({ responseDelayMs: 250 });

    await page.evaluate(() => {
      const originalSetTimeout = window.setTimeout.bind(window);
      window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
        const adjustedTimeout = timeout === 15000 ? 50 : timeout;
        return originalSetTimeout(handler, adjustedTimeout, ...args);
      }) as typeof window.setTimeout;
    });

    await initAgainstMiddleware(page, stack.middlewareCollectUrl);

    await page.waitForTimeout(300);
    await stack.configureMiddleware({ responseDelayMs: 0 });

    await expect
      .poll(async () => (await stack.getApiState()).capturedRequests.length, {
        message: 'retry should reach API after timeout recovery',
      })
      .toBe(2);

    const state = await stack.getApiState();
    expect(state.events).toHaveLength(2);
    expect(state.events.map((event) => event.type)).toEqual(['session_start', 'page_view']);
    expect(state.capturedRequests[0]?.events?.map((event) => event.type)).toEqual(['session_start', 'page_view']);
    expect(state.capturedRequests[1]?.events?.map((event) => event.type)).toEqual(['page_view']);
    expect(state.capturedRequests[0]?._metadata?.idempotency_token).toBe(
      state.capturedRequests[1]?._metadata?.idempotency_token,
    );
  });

  test('should flush pending events via sendBeacon on destroy without breaking ingestion', async ({ page }) => {
    await initAgainstMiddleware(page, stack.middlewareCollectUrl);

    await expect.poll(async () => (await stack.getApiState()).capturedRequests.length).toBe(1);

    const sendBeaconResult = await page.evaluate(() => {
      const windowWithBeaconState = window as Window & { __sendBeaconCalls?: string[] };
      windowWithBeaconState.__sendBeaconCalls = [];
      const bridge = window.__traceLogBridge;

      if (!bridge) {
        throw new Error('TraceLog bridge not available');
      }

      navigator.sendBeacon = ((url: string | URL) => {
        const requestUrl = String(url);
        windowWithBeaconState.__sendBeaconCalls?.push(requestUrl);

        return true;
      }) as typeof navigator.sendBeacon;

      bridge.event('checkout_started', { step: 1 });
      const queueLengthBeforeDestroy = bridge.getQueueLength();
      bridge.destroy(true);
      return {
        queueLengthBeforeDestroy,
        sendBeaconCalls: windowWithBeaconState.__sendBeaconCalls?.length ?? 0,
      };
    });

    const state = await stack.getApiState();
    expect(sendBeaconResult.queueLengthBeforeDestroy).toBe(1);
    expect(sendBeaconResult.sendBeaconCalls).toBe(1);
    expect(state.events.map((event) => event.type)).toEqual(['session_start', 'page_view']);
    expect(state.capturedRequests).toHaveLength(1);
  });

  test('should keep ingestion healthy when geolocation returns null after a slow best-effort lookup', async ({
    page,
  }) => {
    await stack.configureMiddleware({ geoMode: 'null', geoDelayMs: 2500 });

    const startedAt = Date.now();
    await initAgainstMiddleware(page, stack.middlewareCollectUrl);

    await expect
      .poll(async () => (await stack.getApiState()).events.length, {
        message: 'events should still reach API when geolocation is slow',
      })
      .toBe(2);

    const elapsedMs = Date.now() - startedAt;
    const state = await stack.getApiState();

    expect(elapsedMs).toBeLessThan(5000);
    expect(state.events.map((event) => event.type)).toEqual(['session_start', 'page_view']);
    expect(state.sessions[0]?.location).toBeUndefined();
    expect(state.visitors[0]?.first_location).toBeUndefined();
  });

  test('should surface API 429s without inserting corrupt duplicates', async ({ page }) => {
    await initAgainstMiddleware(page, stack.middlewareCollectUrl, { sendIntervalMs: 5000 });

    const sessionId = await page.evaluate(() => {
      const bridge = window.__traceLogBridge;

      if (!bridge) {
        throw new Error('TraceLog bridge not available');
      }

      return bridge.getSessionData()?.id as string;
    });
    await stack.setApiSessionBatchCount(sessionId, 20);

    await page.evaluate(async () => {
      const bridge = window.__traceLogBridge;

      if (!bridge) {
        throw new Error('TraceLog bridge not available');
      }

      await bridge.flushQueue();
    });
    await page.waitForTimeout(500);

    const state = await stack.getApiState();
    expect(state.events).toHaveLength(0);
    expect(state.capturedRequests).toHaveLength(1);
  });
});
