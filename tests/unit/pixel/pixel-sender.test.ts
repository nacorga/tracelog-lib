/**
 * Shopify Web Pixel — pixel-sender tests
 *
 * Verifies:
 * - Posts to ingest.tracelog.io (NOT api.tracelog.io)
 * - keepalive flag set (sandbox may tear down)
 * - Body is JSON-serialized
 * - Failures swallowed silently (best-effort by design)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendBatch, type PixelEventBody } from '../../../src/pixel/pixel-sender';

const BODY: PixelEventBody = {
  user_id: 'user-1',
  session_id: 'sess-1',
  device: { type: 'unknown', os: 'unknown', browser: 'unknown' },
  events: [
    {
      id: 'evt-1',
      type: 'custom',
      page_url: 'https://shop.example.com/checkouts/abc',
      timestamp: 1_700_000_000_000,
      custom_event: { name: 'shopify_checkout_started', metadata: {} },
    },
  ],
  _metadata: { client_version: 'shopify-web-pixel-1', timestamp: 1_700_000_000_000 },
};

describe('sendBatch', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts to ingest.tracelog.io/p/<projectId>/collect', () => {
    sendBatch({ projectId: 'proj-abc' }, BODY);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]![0]).toBe('https://ingest.tracelog.io/p/proj-abc/collect');
  });

  it('does NOT post to api.tracelog.io (CORS handler is on the middleware)', () => {
    sendBatch({ projectId: 'proj-abc' }, BODY);

    const url = fetchSpy.mock.calls[0]![0] as string;
    expect(url).not.toContain('api.tracelog.io');
  });

  it('uses POST + JSON content-type + keepalive', () => {
    sendBatch({ projectId: 'proj-abc' }, BODY);

    const init = fetchSpy.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(init.keepalive).toBe(true);
  });

  it('serializes body to JSON', () => {
    sendBatch({ projectId: 'proj-abc' }, BODY);

    const init = fetchSpy.mock.calls[0]![1] as RequestInit;
    const parsed = JSON.parse(init.body as string);
    expect(parsed.user_id).toBe('user-1');
    expect(parsed.session_id).toBe('sess-1');
    expect(parsed.events[0].custom_event.name).toBe('shopify_checkout_started');
  });

  it('swallows fetch rejections silently', () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('network down'));

    expect(() => {
      sendBatch({ projectId: 'proj-abc' }, BODY);
    }).not.toThrow();
  });

  it('swallows synchronous fetch throws silently', () => {
    global.fetch = vi.fn().mockImplementation(() => {
      throw new Error('fetch unavailable');
    });

    expect(() => {
      sendBatch({ projectId: 'proj-abc' }, BODY);
    }).not.toThrow();
  });
});
