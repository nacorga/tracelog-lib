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
    global.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (global as { fetch?: unknown }).fetch;
  });

  it('posts to ingest.tracelog.io/p/<projectId>/collect', () => {
    void sendBatch({ projectId: 'proj-abc' }, BODY);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]![0]).toBe('https://ingest.tracelog.io/p/proj-abc/collect');
  });

  it('does NOT post to api.tracelog.io (CORS handler is on the middleware)', () => {
    void sendBatch({ projectId: 'proj-abc' }, BODY);

    const url = fetchSpy.mock.calls[0]![0] as string;
    expect(url).not.toContain('api.tracelog.io');
  });

  it('uses POST + JSON content-type + keepalive', () => {
    void sendBatch({ projectId: 'proj-abc' }, BODY);

    const init = fetchSpy.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(init.keepalive).toBe(true);
  });

  it('serializes body to JSON', () => {
    void sendBatch({ projectId: 'proj-abc' }, BODY);

    const init = fetchSpy.mock.calls[0]![1] as RequestInit;
    const parsed = JSON.parse(init.body as string);
    expect(parsed.user_id).toBe('user-1');
    expect(parsed.session_id).toBe('sess-1');
    expect(parsed.events[0].custom_event.name).toBe('shopify_checkout_started');
  });

  it('returns the same validated receipt contract used by the standard sender', async () => {
    const receipt = {
      outcome: 'partial',
      accepted: 1,
      duplicates: 0,
      filtered: 0,
      dropped: 1,
      coverage: 'partial',
    } as const;
    fetchSpy.mockResolvedValue({ ok: true, json: async () => await Promise.resolve(receipt) });

    await expect(sendBatch({ projectId: 'proj-abc' }, BODY)).resolves.toEqual(receipt);
  });

  // Resolving to null is asserted rather than "does not throw": `sendBatch` is async, so a
  // synchronous-throw assertion passes even with every catch block deleted.
  it('swallows fetch rejections silently', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('network down'));

    await expect(sendBatch({ projectId: 'proj-abc' }, BODY)).resolves.toBeNull();
  });

  it('swallows synchronous fetch throws silently', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      throw new Error('fetch unavailable');
    });

    await expect(sendBatch({ projectId: 'proj-abc' }, BODY)).resolves.toBeNull();
  });

  it('reads a rejection receipt only when the body proves a TraceLog host wrote it', async () => {
    const receiptFields = {
      outcome: 'rejected',
      accepted: 0,
      duplicates: 0,
      filtered: 0,
      dropped: 2,
      reason: 'session_band',
      coverage: 'partial',
    } as const;

    // No `statusCode` echoing the HTTP status — a parked page or CDN backend could send this.
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 402,
      json: async () => await Promise.resolve(receiptFields),
    });
    await expect(sendBatch({ projectId: 'proj-abc' }, BODY)).resolves.toBeNull();

    // The middleware's real envelope carries the signature alongside the receipt.
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 402,
      json: async () => await Promise.resolve({ statusCode: 402, error: 'SESSION_BAND_PAUSED', ...receiptFields }),
    });
    await expect(sendBatch({ projectId: 'proj-abc' }, BODY)).resolves.toEqual(receiptFields);
  });

  it('returns null when the response body is not JSON', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => await Promise.reject(new SyntaxError('not json')),
    });

    await expect(sendBatch({ projectId: 'proj-abc' }, BODY)).resolves.toBeNull();
  });

  it('drops the request when projectId is empty (avoids 404 on `/p//collect`)', () => {
    void sendBatch({ projectId: '' }, BODY);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('URL-encodes projectId so unsafe characters cannot break the path', () => {
    void sendBatch({ projectId: 'proj abc/foo?bar' }, BODY);

    const url = fetchSpy.mock.calls[0]![0] as string;
    expect(url).toBe('https://ingest.tracelog.io/p/proj%20abc%2Ffoo%3Fbar/collect');
  });
});
