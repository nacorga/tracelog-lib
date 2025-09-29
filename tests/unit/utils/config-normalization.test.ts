import { describe, test, expect } from 'vitest';
import { normalizeConfig } from '@/utils';
import { DEFAULT_SAMPLING_RATE } from '@/constants';
import { Config, Mode } from '@/types';

const createConfig = (overrides: Partial<Config> = {}): Config => ({
  id: 'test-project',
  samplingRate: 1,
  sessionTimeout: 60_000,
  excludedUrlPaths: [],
  mode: Mode.QA,
  ipExcluded: false,
  allowHttp: false,
  tags: [],
  ...overrides,
});

describe('normalizeConfig', () => {
  test('keeps valid sampling rate untouched', () => {
    const { config, errors } = normalizeConfig(createConfig({ samplingRate: 0.5 }));

    expect(errors).toHaveLength(0);
    expect(config.samplingRate).toBe(0.5);
  });

  test('defaults sampling rate when zero provided', () => {
    const { config, errors } = normalizeConfig(createConfig({ samplingRate: 0 }));

    expect(config.samplingRate).toBe(DEFAULT_SAMPLING_RATE);
    expect(errors).toContain('Sampling rate must be greater than 0 and less than or equal to 1');
  });

  test('preserves excluded url patterns while normalizing sampling rate', () => {
    const excludedUrlPaths = ['#/blocked'];
    const { config } = normalizeConfig(createConfig({ samplingRate: 0, excludedUrlPaths }));

    expect(config.samplingRate).toBe(DEFAULT_SAMPLING_RATE);
    expect(config.excludedUrlPaths).toEqual(excludedUrlPaths);
  });

  test('collects validation warnings and preserves other fields', () => {
    const sessionTimeout = 10_000; // below minimum
    const { config, errors } = normalizeConfig(createConfig({ samplingRate: 0.2, sessionTimeout }));

    expect(config.samplingRate).toBe(0.2);
    expect(config.sessionTimeout).toBe(sessionTimeout);
    expect(errors).toContain('sessionTimeout must be at least 30 seconds (30000ms)');
  });
});
