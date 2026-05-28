import { describe, expect, it, vi } from 'vitest';
import { getCollectApiUrls } from '../../../../src/utils/network/url.utils';

describe('network url utils', () => {
  describe('getCollectApiUrls', () => {
    it('uses explicit collectUrl when provided', () => {
      const urls = getCollectApiUrls({
        integrations: {
          tracelog: {
            projectId: 'project-1',
            collectUrl: 'https://ingest.tracelog.io/p/project-1/collect',
          },
        },
      });

      expect(urls.saas).toBe('https://ingest.tracelog.io/p/project-1/collect');
    });

    it('bypasses the localhost restriction when collectUrl is provided', () => {
      // jsdom default URL is http://localhost:3000 — without collectUrl this would throw.
      expect(() =>
        getCollectApiUrls({
          integrations: {
            tracelog: {
              projectId: 'project-1',
              collectUrl: 'https://ingest.tracelog.io/p/project-1/collect',
            },
          },
        }),
      ).not.toThrow();
    });

    it('keeps the CNAME fallback when collectUrl is absent', () => {
      vi.stubGlobal('window', { location: { href: 'https://store.example.com/products/1' } });

      const urls = getCollectApiUrls({
        integrations: { tracelog: { projectId: 'project-1' } },
      });

      expect(urls.saas).toBe('https://project-1.example.com/collect');

      vi.unstubAllGlobals();
    });

    it('throws on localhost when collectUrl is absent', () => {
      // jsdom default URL is http://localhost:3000.
      expect(() =>
        getCollectApiUrls({
          integrations: { tracelog: { projectId: 'project-1' } },
        }),
      ).toThrow(/SaaS integration requires a domain hostname/);
    });

    it('returns an empty object when no SaaS integration is configured', () => {
      expect(getCollectApiUrls({})).toEqual({});
    });
  });
});
