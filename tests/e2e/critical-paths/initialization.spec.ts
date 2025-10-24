/**
 * E2E: Initialization Tests
 * Focus: Basic initialization and config in real browser
 */

import { test, expect } from '@playwright/test';

test.describe('E2E: Initialization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?auto-init=false');
  });

  test.describe('Basic Initialization', () => {
    test('should initialize without config (standalone mode)', async ({ page }) => {
      const result = await page.evaluate(async () => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init();

        return {
          initialized: window.__traceLogBridge.initialized,
        };
      });

      expect(result.initialized).toBe(true);
    });
  });

  test.describe('Integration Configuration', () => {
    test('should initialize with custom backend integration', async ({ page }) => {
      const result = await page.evaluate(async () => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init({
          integrations: {
            custom: {
              collectApiUrl: 'https://custom-backend.example.com/collect',
            },
          },
        });

        return {
          initialized: window.__traceLogBridge.initialized,
          hasCustomBackend: Boolean(window.__traceLogBridge.getFullState().collectApiUrls?.custom),
        };
      });

      expect(result.initialized).toBe(true);
      expect(result.hasCustomBackend).toBe(true);
    });

    test('should reject tracelog integration on localhost', async ({ page }) => {
      const result = await page.evaluate(async () => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        window.__traceLogBridge.destroy(true);

        // SaaS integration should be rejected on localhost for security
        let initError: string | null = null;
        try {
          await window.__traceLogBridge.init({
            integrations: {
              tracelog: {
                projectId: 'test-project-123',
              },
            },
          });
        } catch (error) {
          initError = error instanceof Error ? error.message : String(error);
        }

        return {
          initError,
        };
      });

      // SaaS integration should fail on localhost
      expect(result.initError).toContain('SaaS integration not supported on localhost');
    });

    test('should initialize with custom integration (SaaS rejected on localhost)', async ({ page }) => {
      const result = await page.evaluate(async () => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        window.__traceLogBridge.destroy(true);

        // Multi-integration with SaaS should fail on localhost
        let initError: string | null = null;
        try {
          await window.__traceLogBridge.init({
            integrations: {
              tracelog: {
                projectId: 'test-project-456',
              },
              custom: {
                collectApiUrl: 'https://warehouse.example.com/collect',
              },
            },
          });
        } catch (error) {
          initError = error instanceof Error ? error.message : String(error);
        }

        return {
          initError,
        };
      });

      // SaaS integration should fail on localhost
      expect(result.initError).toContain('SaaS integration not supported on localhost');
    });
  });

  test.describe('Session Management', () => {
    test('should generate userId on first init', async ({ page }) => {
      const result = await page.evaluate(async () => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        // Clear storage to simulate first visit
        localStorage.clear();
        sessionStorage.clear();

        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init();

        const userId = window.__traceLogBridge.getFullState().userId;

        return {
          initialized: window.__traceLogBridge.initialized,
          userId,
          isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId || ''),
        };
      });

      expect(result.initialized).toBe(true);
      expect(result.userId).toBeDefined();
      expect(result.userId).not.toBe('');
      expect(result.isUUID).toBe(true);
    });

    test('should restore userId from storage', async ({ page }) => {
      const result = await page.evaluate(async () => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        // First initialization
        localStorage.clear();
        sessionStorage.clear();

        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init();

        const firstUserId = window.__traceLogBridge.getFullState().userId;

        // Simulate page reload by destroying and re-initializing
        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init();

        const secondUserId = window.__traceLogBridge.getFullState().userId;

        return {
          firstUserId,
          secondUserId,
          persisted: firstUserId === secondUserId,
        };
      });

      expect(result.firstUserId).toBeDefined();
      expect(result.secondUserId).toBeDefined();
      expect(result.persisted).toBe(true);
    });

    test('should generate sessionId on init', async ({ page }) => {
      const result = await page.evaluate(async () => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        localStorage.clear();
        sessionStorage.clear();

        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init();

        const sessionId = window.__traceLogBridge.getFullState().sessionId;

        return {
          initialized: window.__traceLogBridge.initialized,
          sessionId,
          // SessionId format: {timestamp}-{random-alphanumeric} (e.g., "1729795200000-abc123xyz")
          isValidId: /^\d+-[a-z0-9]+$/.test(sessionId || ''),
        };
      });

      expect(result.initialized).toBe(true);
      expect(result.sessionId).toBeDefined();
      expect(result.sessionId).not.toBe('');
      expect(result.isValidId).toBe(true);
    });
  });
});
