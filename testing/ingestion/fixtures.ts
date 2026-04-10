import { LIB_VERSION } from '../../src/constants/version.constants';

export const INGESTION_TEST_IDS = {
  project: '507f1f77bcf86cd799439011',
  client: '507f1f77bcf86cd799439012',
} as const;

export const INGESTION_TEST_HOST = 'shop.localhost';
export const INGESTION_TEST_ORIGIN = `http://${INGESTION_TEST_HOST}:3000`;
export const INGESTION_TEST_SOURCE_URL = `${INGESTION_TEST_ORIGIN}/catalog?ref=ad`;
export const INGESTION_TEST_PROJECT = {
  identifier: 'shop',
  domain: INGESTION_TEST_HOST,
  name: 'Shop',
  description: 'Shared ingestion test project',
} as const;

export const INGESTION_TEST_USER_ID = 'user-uuid-123';
export const INGESTION_TEST_SESSION_ID = 'session-uuid-456';
export const INGESTION_TEST_CLIENT_VERSION = LIB_VERSION;
export const INGESTION_TEST_IP = '8.8.8.8';

export interface IngestionTestEvent {
  id: string;
  type: string;
  timestamp: number;
  page_url: string;
  [key: string]: unknown;
}

export interface IngestionTestPayload {
  project: string;
  user_id: string;
  session_id: string;
  device:
    | {
        type: string;
        os: string;
        browser: string;
      }
    | string;
  events: IngestionTestEvent[];
  source: string;
  ip: string;
  _metadata: {
    client_version: string;
    idempotency_token?: string;
    referer?: string;
    timestamp?: number;
  };
}

function now(offsetMs = 0): number {
  return Date.now() + offsetMs;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createSessionStartEvent(
  overrides: Partial<IngestionTestEvent> = {},
): IngestionTestEvent {
  return {
    id: 'evt-session-start-1',
    type: 'session_start',
    timestamp: now(),
    page_url: `${INGESTION_TEST_ORIGIN}/`,
    ...overrides,
  };
}

export function createPageViewEvent(
  overrides: Partial<IngestionTestEvent> = {},
): IngestionTestEvent {
  return {
    id: 'evt-page-view-1',
    type: 'page_view',
    timestamp: now(10),
    page_url: `${INGESTION_TEST_ORIGIN}/catalog`,
    ...overrides,
  };
}

export function createClickEvent(
  overrides: Partial<IngestionTestEvent> = {},
): IngestionTestEvent {
  return {
    id: 'evt-click-1',
    type: 'click',
    timestamp: now(20),
    page_url: `${INGESTION_TEST_ORIGIN}/catalog`,
    click_data: {
      x: 10,
      y: 20,
      relativeX: 0.1,
      relativeY: 0.2,
      tag: 'button',
    },
    ...overrides,
  };
}

export function createCustomEvent(
  overrides: Partial<IngestionTestEvent> = {},
): IngestionTestEvent {
  return {
    id: 'evt-custom-1',
    type: 'custom',
    timestamp: now(30),
    page_url: `${INGESTION_TEST_ORIGIN}/checkout`,
    custom_event: {
      name: 'checkout_started',
      metadata: {
        step: 1,
      },
    },
    ...overrides,
  };
}

export function createBaseCollectPayload(
  overrides: Partial<IngestionTestPayload> = {},
): IngestionTestPayload {
  return {
    project: INGESTION_TEST_IDS.project,
    user_id: INGESTION_TEST_USER_ID,
    session_id: INGESTION_TEST_SESSION_ID,
    device: {
      type: 'desktop',
      os: 'macOS',
      browser: 'Chrome',
    },
    events: [createPageViewEvent()],
    source: INGESTION_TEST_SOURCE_URL,
    ip: INGESTION_TEST_IP,
    _metadata: {
      client_version: INGESTION_TEST_CLIENT_VERSION,
      idempotency_token: 'stable-batch-token',
    },
    ...overrides,
  };
}

export function createHappyPathCollectPayload(
  overrides: Partial<IngestionTestPayload> = {},
): IngestionTestPayload {
  return createBaseCollectPayload({
    events: [
      createSessionStartEvent({
        id: 'evt-session-start-happy',
        location: {
          country: 'Spain',
          country_code: 'ES',
        },
      }),
      createPageViewEvent({ id: 'evt-page-view-happy' }),
    ],
    source: INGESTION_TEST_SOURCE_URL,
    _metadata: {
      client_version: INGESTION_TEST_CLIENT_VERSION,
      idempotency_token: 'token-happy-path',
    },
    ...overrides,
  });
}

export function createMutatedRetryCollectPayloads(): {
  first: IngestionTestPayload;
  retry: IngestionTestPayload;
} {
  return {
    first: createBaseCollectPayload({
      events: [
        createSessionStartEvent({ id: 'evt-session-start-token' }),
        createPageViewEvent({ id: 'evt-page-view-token' }),
      ],
      _metadata: {
        client_version: INGESTION_TEST_CLIENT_VERSION,
        idempotency_token: 'token-mutated-retry',
      },
    }),
    retry: createBaseCollectPayload({
      events: [
        createPageViewEvent({
          id: 'evt-page-view-mutated',
          page_url: `${INGESTION_TEST_ORIGIN}/pricing`,
        }),
      ],
      source: `${INGESTION_TEST_ORIGIN}/pricing`,
      _metadata: {
        client_version: INGESTION_TEST_CLIENT_VERSION,
        idempotency_token: 'token-mutated-retry',
      },
    }),
  };
}

export function createGeoTimeoutCollectPayload(
  overrides: Partial<IngestionTestPayload> = {},
): IngestionTestPayload {
  return createBaseCollectPayload({
    events: [
      createSessionStartEvent({ id: 'evt-session-start-geo-timeout' }),
      createPageViewEvent({ id: 'evt-page-view-geo-timeout' }),
    ],
    _metadata: {
      client_version: INGESTION_TEST_CLIENT_VERSION,
      idempotency_token: 'token-geo-timeout',
    },
    ...overrides,
  });
}

export function createLegacyCollectPayload(
  overrides: Partial<IngestionTestPayload> = {},
): IngestionTestPayload {
  const payload = createBaseCollectPayload({
    events: [createPageViewEvent({ id: 'evt-legacy-page-view' })],
    _metadata: {
      client_version: '2.0.0',
    },
    ...overrides,
  });

  delete payload._metadata.idempotency_token;
  return payload;
}

export function createFutureTimestampCollectPayload(
  overrides: Partial<IngestionTestPayload> = {},
): IngestionTestPayload {
  return createBaseCollectPayload({
    events: [
      createPageViewEvent({
        id: 'evt-future-page-view',
        timestamp: now(20 * 60 * 1000),
        page_url: `${INGESTION_TEST_ORIGIN}/future`,
      }),
    ],
    _metadata: {
      client_version: INGESTION_TEST_CLIENT_VERSION,
      idempotency_token: 'token-future',
    },
    ...overrides,
  });
}

export function createHighBatchRateCollectPayload(
  overrides: Partial<IngestionTestPayload> = {},
): IngestionTestPayload {
  return createBaseCollectPayload({
    events: [createPageViewEvent({ id: 'evt-rate-limit-page-view' })],
    _metadata: {
      client_version: INGESTION_TEST_CLIENT_VERSION,
      idempotency_token: 'token-rate-limit',
    },
    ...overrides,
  });
}

export const CANONICAL_INGESTION_FIXTURES = {
  happyPath: createHappyPathCollectPayload(),
  mutatedRetry: createMutatedRetryCollectPayloads(),
  geoTimeout: createGeoTimeoutCollectPayload(),
  legacyWithoutToken: createLegacyCollectPayload(),
  futureTimestamp: createFutureTimestampCollectPayload(),
  highBatchRate: createHighBatchRateCollectPayload(),
} as const;

export function cloneCanonicalFixture<T>(fixture: T): T {
  return clone(fixture);
}
