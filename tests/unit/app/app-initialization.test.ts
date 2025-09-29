import { describe, test, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { App } from '@/app';
import { ConfigManager } from '@/managers/config.manager';
import { EventManager } from '@/managers/event.manager';
import { SessionHandler } from '@/handlers/session.handler';
import { PageViewHandler } from '@/handlers/page-view.handler';
import { ClickHandler } from '@/handlers/click.handler';
import { ScrollHandler } from '@/handlers/scroll.handler';
import { PerformanceHandler } from '@/handlers/performance.handler';
import { ErrorHandler } from '@/handlers/error.handler';
import { GoogleAnalyticsIntegration } from '@/integrations/google-analytics.integration';
import { cleanupTestState } from '../../utils/test-setup';
import { Mode } from '@/types';

vi.mock('@/managers/config.manager');
vi.mock('@/managers/event.manager');
vi.mock('@/handlers/session.handler');
vi.mock('@/handlers/page-view.handler');
vi.mock('@/handlers/click.handler');
vi.mock('@/handlers/scroll.handler');
vi.mock('@/handlers/performance.handler');
vi.mock('@/handlers/error.handler');
vi.mock('@/integrations/google-analytics.integration');
vi.mock('@/utils/logging', () => ({
  debugLog: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockValidConfig = {
  id: 'project-id',
  mode: Mode.QA,
  allowHttp: false,
  ipExcluded: false,
  excludedUrlPaths: [],
};

describe('App initialization resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (ConfigManager as unknown as Mock).mockImplementation(() => ({
      get: vi.fn().mockResolvedValue(mockValidConfig),
    }));

    (GoogleAnalyticsIntegration as unknown as Mock).mockImplementation(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      cleanup: vi.fn(),
    }));

    (EventManager as unknown as Mock).mockImplementation(() => ({
      recoverPersistedEvents: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      track: vi.fn(),
    }));

    const createHandlerMock = () => ({
      startTracking: vi.fn().mockResolvedValue(undefined),
      stopTracking: vi.fn().mockResolvedValue(undefined),
    });

    (SessionHandler as unknown as Mock).mockImplementation(createHandlerMock);
    (PageViewHandler as unknown as Mock).mockImplementation(() => ({
      startTracking: vi.fn(),
      stopTracking: vi.fn(),
    }));
    (ClickHandler as unknown as Mock).mockImplementation(() => ({
      startTracking: vi.fn(),
      stopTracking: vi.fn(),
    }));
    (ScrollHandler as unknown as Mock).mockImplementation(() => ({
      startTracking: vi.fn(),
      stopTracking: vi.fn(),
    }));
    (PerformanceHandler as unknown as Mock).mockImplementation(createHandlerMock);
    (ErrorHandler as unknown as Mock).mockImplementation(() => ({
      startTracking: vi.fn(),
      stopTracking: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanupTestState();
  });

  test('should clean up handlers when initialization fails after handlers start', async () => {
    // Mock ConfigManager to fail
    (ConfigManager as unknown as Mock).mockImplementation(() => ({
      get: vi.fn().mockRejectedValue(new Error('config failure')),
    }));

    const app = new App();

    await expect(
      app.init({
        id: 'project-id',
        allowHttp: false,
      }),
    ).rejects.toThrow('TraceLog initialization failed');

    expect(app['handlers']).toEqual({});
  });

  test('should invoke forced destroy when EventManager constructor throws', async () => {
    (EventManager as unknown as Mock).mockImplementation(() => {
      throw new Error('construction failure');
    });

    const app = new App();

    await expect(
      app.init({
        id: 'project-id',
        allowHttp: false,
      }),
    ).rejects.toThrow('TraceLog initialization failed');

    expect(app['handlers']).toEqual({});
  });
});
