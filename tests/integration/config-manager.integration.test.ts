import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConfigManager } from '@/managers/config.manager';
import { DEFAULT_SESSION_TIMEOUT } from '@/constants';
import { SpecialProjectId, AppConfig, Mode } from '@/types';

const createAppConfig = (overrides: Partial<AppConfig> = {}): AppConfig => ({
  id: 'project-123',
  samplingRate: 0.5,
  sessionTimeout: DEFAULT_SESSION_TIMEOUT,
  mode: Mode.QA,
  allowHttp: false,
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
      createAppConfig({ id: SpecialProjectId.Skip, samplingRate: 0.5 }),
    );

    expect(config.samplingRate).toBe(0.5); // Respects app config for skip mode
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

    expect(config.samplingRate).toBe(0); // API config takes precedence
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
    const appConfig = createAppConfig({ samplingRate: 0.5 });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ipExcluded: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }) as Response,
    );

    const config = await manager.get('https://api.example.com', appConfig);

    expect(config.samplingRate).toBe(0.5); // Respects app config when API doesn't specify
    expect(config.ipExcluded).toBe(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
