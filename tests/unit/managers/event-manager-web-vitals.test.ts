/**
 * EventManager - Web Vitals consolidation loose ends
 *
 * Regression coverage for two EventManager-level fixes that guard the
 * consolidated Web Vitals event's honesty:
 *
 * 1. `samplingRate` exemption — a merchant's sampling rate must never
 *    silently thin the Core Web Vitals sample out from under the honesty
 *    guarantee consolidation was built to provide. WEB_VITALS is exempt;
 *    every other non-critical event type still respects it.
 * 2. Dedup fingerprint includes content — the consolidated payload carries
 *    every measured metric's value, so two genuinely different measurements
 *    for the same page within `DUPLICATE_EVENT_THRESHOLD_MS` must not
 *    collapse into one just because both are `web_vitals` events for the
 *    same `page_url`. A literal resend of the same content must still dedup.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { MOCK_DEVICE_INFO } from '../../helpers/fixtures.helper';
import { EventManager } from '../../../src/managers/event.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { EventType } from '../../../src/types';
import type { WebVitalMetric } from '../../../src/types';

describe('EventManager - Web Vitals consolidation', () => {
  let eventManager: EventManager;
  let storageManager: StorageManager;

  beforeEach(() => {
    setupTestEnvironment();
    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager, null);

    eventManager['set']('userId', 'user-vitals');
    eventManager['set']('device', MOCK_DEVICE_INFO);
    eventManager['set']('pageUrl', 'https://example.com/vitals');
    eventManager['set']('sessionId', 'session-vitals');
  });

  afterEach(() => {
    eventManager.stop();
    cleanupTestEnvironment();
  });

  const trackVital = (metrics: WebVitalMetric[]): void => {
    eventManager.track({
      type: EventType.WEB_VITALS,
      web_vitals: { schema: 'consolidated', metrics },
    });
  };

  const queuedVitals = (): unknown[] => eventManager.getQueueEvents().filter((e) => e.type === EventType.WEB_VITALS);

  describe('samplingRate exemption', () => {
    it('reaches the queue even when samplingRate is 0', () => {
      eventManager['set']('config', { samplingRate: 0 });

      trackVital([{ type: 'LCP', value: 1200 }]);

      expect(queuedVitals()).toHaveLength(1);
    });

    it('does not exempt other non-critical event types from the same samplingRate:0 config', () => {
      eventManager['set']('config', { samplingRate: 0 });

      eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'test_event' } });

      const queued = eventManager.getQueueEvents().filter((e) => e.type === EventType.CUSTOM);
      expect(queued).toHaveLength(0);
    });
  });

  describe('dedup fingerprint includes content', () => {
    it('does not collapse two distinct consolidated measurements for the same page within the dedup window', () => {
      trackVital([{ type: 'LCP', value: 1000 }]);
      trackVital([{ type: 'LCP', value: 2000 }]);

      expect(queuedVitals()).toHaveLength(2);
    });

    it('does not collapse two consolidated events carrying a different metric set', () => {
      trackVital([{ type: 'LCP', value: 1000 }]);
      trackVital([
        { type: 'LCP', value: 1000 },
        { type: 'CLS', value: 0.05 },
      ]);

      expect(queuedVitals()).toHaveLength(2);
    });

    it('still collapses a literal duplicate resend of the same content within the dedup window', () => {
      trackVital([{ type: 'LCP', value: 1000 }]);
      trackVital([{ type: 'LCP', value: 1000 }]);

      expect(queuedVitals()).toHaveLength(1);
    });
  });
});
