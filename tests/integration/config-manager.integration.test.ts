import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConfigManager } from '@/managers/config.manager';
import { DEFAULT_CONFIG } from '@/constants';
import { SpecialProjectId, Config, Mode } from '@/types';

const createAppConfig = (overrides: Partial<Config> = {}): Config =>
  DEFAULT_CONFIG({
    id: 'project-123',
    samplingRate: 0.5,
    sessionTimeout: 60_000,
    excludedUrlPaths: [],
    mode: Mode.QA,
    ipExcluded: false,
    allowHttp: false,
    tags: [],
    ...overrides,
  });

describe('ConfigManager integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ href: 'https://example.com', search: '' } as Location);
  });

  test('normalizes skip-mode configuration', async () => {
    const manager = new ConfigManager();
    const config = await manager.get(
      'https://api.example.com',
      createAppConfig({ id: SpecialProjectId.Skip, samplingRate: 0 }),
    );

    expect(config.samplingRate).toBe(1);
    expect(config.id).toBe(SpecialProjectId.Skip);
    expect(config.mode).toBe(Mode.DEBUG);
  });

  test('normalizes API configuration response', async () => {
    const manager = new ConfigManager();
    const appConfig = createAppConfig({ samplingRate: 1 });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          samplingRate: 0,
          excludedUrlPaths: ['#/blocked'],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ) as Response,
    );

    const config = await manager.get('https://api.example.com', appConfig);

    expect(config.samplingRate).toBe(1);
    expect(config.excludedUrlPaths).toEqual(['#/blocked']);
  });

  test('applies QA mode from URL parameter', async () => {
    const manager = new ConfigManager();
    const appConfig = createAppConfig({ mode: undefined });

    vi.spyOn(window, 'location', 'get').mockReturnValue({
      href: 'https://example.com?qaMode=true',
      search: '?qaMode=true',
    } as Location);
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }) as Response,
    );

    const config = await manager.get('https://api.example.com', appConfig);

    expect(config.mode).toBe(Mode.QA);
  });

  test('preserves ip exclusion flag from API response', async () => {
    const manager = new ConfigManager();
    const appConfig = createAppConfig({ ipExcluded: false, samplingRate: 0 });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ipExcluded: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }) as Response,
    );

    const config = await manager.get('https://api.example.com', appConfig);

    expect(config.samplingRate).toBe(1);
    expect(config.ipExcluded).toBe(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
