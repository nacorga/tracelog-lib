import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateAppConfig, validateAndNormalizeConfig } from '../../src/utils/validations/config-validations.utils';
import { Config } from '../../src/types';
import {
  AppConfigValidationError,
  SessionTimeoutValidationError,
  SamplingRateValidationError,
  IntegrationValidationError,
} from '../../src/types/validation-error.types';
import { MIN_SESSION_TIMEOUT_MS, MAX_SESSION_TIMEOUT_MS } from '../../src/constants';

describe('Config Validations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateAppConfig()', () => {
    describe('Basic Configuration Validation', () => {
      it('should validate minimal valid config', () => {
        const config: Config = {};
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should validate complete valid config', () => {
        const config: Config = {
          sessionTimeout: 900000,
          globalMetadata: { version: '1.0' },
          sensitiveQueryParams: ['token', 'key'],
          errorSampling: 0.5,
        };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should reject null config', () => {
        expect(() => {
          validateAppConfig(null as any);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(null as any);
        }).toThrow('Configuration must be an object');
      });

      it('should accept undefined config', () => {
        expect(() => {
          validateAppConfig(undefined);
        }).not.toThrow();
      });

      it('should reject non-object config', () => {
        expect(() => {
          validateAppConfig('not-object' as any);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(123 as any);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(true as any);
        }).toThrow(AppConfigValidationError);
      });

      it('should accept empty config', () => {
        const config = {} as Config;
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });
    });

    describe('Session Timeout Validation', () => {
      it('should accept valid session timeout', () => {
        const config: Config = { sessionTimeout: 900000 };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept minimum session timeout', () => {
        const config: Config = { sessionTimeout: MIN_SESSION_TIMEOUT_MS };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept maximum session timeout', () => {
        const config: Config = { sessionTimeout: MAX_SESSION_TIMEOUT_MS };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should reject session timeout below minimum', () => {
        const config: Config = { sessionTimeout: MIN_SESSION_TIMEOUT_MS - 1 };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(SessionTimeoutValidationError);
      });

      it('should reject session timeout above maximum', () => {
        const config: Config = { sessionTimeout: MAX_SESSION_TIMEOUT_MS + 1 };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(SessionTimeoutValidationError);
      });

      it('should reject non-number session timeout', () => {
        expect(() => {
          validateAppConfig({ sessionTimeout: '900000' as any });
        }).toThrow(SessionTimeoutValidationError);
        expect(() => {
          validateAppConfig({ sessionTimeout: true as any });
        }).toThrow(SessionTimeoutValidationError);
      });

      it('should reject negative session timeout', () => {
        const config: Config = { sessionTimeout: -1000 };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(SessionTimeoutValidationError);
      });

      it('should accept undefined session timeout', () => {
        const config: Config = {};
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });
    });

    describe('Global Metadata Validation', () => {
      it('should accept valid object metadata', () => {
        const config: Config = {
          globalMetadata: { version: '1.0', build: 123 },
        };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept empty object metadata', () => {
        const config: Config = { globalMetadata: {} };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should reject null metadata', () => {
        const config: Config = { globalMetadata: null as any };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Global metadata must be an object');
      });

      it('should reject non-object metadata', () => {
        expect(() => {
          validateAppConfig({ globalMetadata: 'string' as any });
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig({ globalMetadata: 123 as any });
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig({ globalMetadata: true as any });
        }).toThrow(AppConfigValidationError);
      });

      it('should accept undefined metadata', () => {
        const config: Config = {};
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });
    });

    describe('Sensitive Query Params Validation', () => {
      it('should accept valid query params array', () => {
        const config: Config = {
          sensitiveQueryParams: ['token', 'apiKey', 'password'],
        };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept empty array', () => {
        const config: Config = { sensitiveQueryParams: [] };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should reject non-array', () => {
        expect(() => {
          validateAppConfig({ sensitiveQueryParams: 'token' as any });
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig({ sensitiveQueryParams: {} as any });
        }).toThrow(AppConfigValidationError);
      });

      it('should reject array with non-string values', () => {
        const config: Config = {
          sensitiveQueryParams: ['token', 123 as any, 'password'],
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('All sensitive query params must be strings');
      });

      it('should accept undefined', () => {
        const config: Config = {};
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });
    });

    describe('Error Sampling Validation', () => {
      it('should accept valid sampling rate 0', () => {
        const config: Config = { errorSampling: 0 };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept valid sampling rate 1', () => {
        const config: Config = { errorSampling: 1 };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept valid sampling rate 0.5', () => {
        const config: Config = { errorSampling: 0.5 };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should reject negative sampling rate', () => {
        const config: Config = { errorSampling: -0.1 };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(SamplingRateValidationError);
      });

      it('should reject sampling rate above 1', () => {
        const config: Config = { errorSampling: 1.1 };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(SamplingRateValidationError);
      });

      it('should reject non-number sampling rate', () => {
        expect(() => {
          validateAppConfig({ errorSampling: '0.5' as any });
        }).toThrow(SamplingRateValidationError);
        expect(() => {
          validateAppConfig({ errorSampling: true as any });
        }).toThrow(SamplingRateValidationError);
      });

      it('should accept undefined', () => {
        const config: Config = {};
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });
    });

    describe('Sampling Rate Validation', () => {
      it('should accept valid sampling rate 0', () => {
        const config: Config = { samplingRate: 0 };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept valid sampling rate 1', () => {
        const config: Config = { samplingRate: 1 };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept valid sampling rate 0.5', () => {
        const config: Config = { samplingRate: 0.5 };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should reject negative sampling rate', () => {
        const config: Config = { samplingRate: -0.1 };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(SamplingRateValidationError);
      });

      it('should reject sampling rate above 1', () => {
        const config: Config = { samplingRate: 1.1 };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(SamplingRateValidationError);
      });

      it('should reject non-number sampling rate', () => {
        expect(() => {
          validateAppConfig({ samplingRate: '0.5' as any });
        }).toThrow(SamplingRateValidationError);
        expect(() => {
          validateAppConfig({ samplingRate: true as any });
        }).toThrow(SamplingRateValidationError);
      });

      it('should accept undefined', () => {
        const config: Config = {};
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });
    });

    describe('Custom Integration Validation', () => {
      it('should accept valid custom integration with collectApiUrl', () => {
        const config: Config = {
          integrations: {
            custom: { collectApiUrl: 'https://api.example.com/collect' },
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept custom integration with allowHttp true', () => {
        const config: Config = {
          integrations: {
            custom: { collectApiUrl: 'http://localhost:3000/collect', allowHttp: true },
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept custom integration with allowHttp false', () => {
        const config: Config = {
          integrations: {
            custom: { collectApiUrl: 'https://api.example.com/collect', allowHttp: false },
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should reject custom integration with non-boolean allowHttp', () => {
        const config: Config = {
          integrations: {
            custom: { collectApiUrl: 'https://api.example.com/collect', allowHttp: 'true' as any },
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(IntegrationValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('allowHttp must be a boolean');
      });

      it('should reject custom integration with empty collectApiUrl', () => {
        const config: Config = {
          integrations: {
            custom: { collectApiUrl: '' },
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(IntegrationValidationError);
      });

      it('should reject custom integration with non-string collectApiUrl', () => {
        const config: Config = {
          integrations: {
            custom: { collectApiUrl: 123 as any },
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(IntegrationValidationError);
      });

      it('should accept undefined custom integration', () => {
        const config: Config = {};
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });
    });

    describe('Google Analytics Integration Validation', () => {
      it('should accept valid Google Analytics 4 measurement ID', () => {
        const config: Config = {
          integrations: {
            googleAnalytics: { measurementId: 'G-XXXXXXXXXX' },
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept valid Universal Analytics ID', () => {
        const config: Config = {
          integrations: {
            googleAnalytics: { measurementId: 'UA-XXXXXXXXX-X' },
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should reject empty measurement ID', () => {
        const config: Config = {
          integrations: {
            googleAnalytics: { measurementId: '' },
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(IntegrationValidationError);
      });

      it('should reject whitespace-only measurement ID', () => {
        const config: Config = {
          integrations: {
            googleAnalytics: { measurementId: '   ' },
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(IntegrationValidationError);
      });

      it('should reject measurement ID without G- or UA- prefix', () => {
        const config: Config = {
          integrations: {
            googleAnalytics: { measurementId: 'XXXXXXXXXX' },
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(IntegrationValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('must start with "G-" or "UA-"');
      });

      it('should reject non-string measurement ID', () => {
        const config: Config = {
          integrations: {
            googleAnalytics: { measurementId: 123 as any },
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(IntegrationValidationError);
      });

      it('should reject null measurement ID', () => {
        const config: Config = {
          integrations: {
            googleAnalytics: { measurementId: null as any },
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(IntegrationValidationError);
      });

      it('should accept undefined integrations', () => {
        const config: Config = {};
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });
    });

    describe('Page View Throttle Validation', () => {
      it('should accept valid pageViewThrottleMs', () => {
        const config: Config = { pageViewThrottleMs: 1000 };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept pageViewThrottleMs of 0', () => {
        const config: Config = { pageViewThrottleMs: 0 };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should reject negative pageViewThrottleMs', () => {
        const config: Config = { pageViewThrottleMs: -100 };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Page view throttle must be a non-negative number');
      });

      it('should reject non-number pageViewThrottleMs', () => {
        expect(() => {
          validateAppConfig({ pageViewThrottleMs: '1000' as any });
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig({ pageViewThrottleMs: true as any });
        }).toThrow(AppConfigValidationError);
      });

      it('should accept undefined pageViewThrottleMs', () => {
        const config: Config = {};
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });
    });

    describe('Click Throttle Validation', () => {
      it('should accept valid clickThrottleMs', () => {
        const config: Config = { clickThrottleMs: 300 };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept clickThrottleMs of 0', () => {
        const config: Config = { clickThrottleMs: 0 };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should reject negative clickThrottleMs', () => {
        const config: Config = { clickThrottleMs: -50 };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Click throttle must be a non-negative number');
      });

      it('should reject non-number clickThrottleMs', () => {
        expect(() => {
          validateAppConfig({ clickThrottleMs: '300' as any });
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig({ clickThrottleMs: false as any });
        }).toThrow(AppConfigValidationError);
      });

      it('should accept undefined clickThrottleMs', () => {
        const config: Config = {};
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });
    });

    describe('Max Same Event Per Minute Validation', () => {
      it('should accept valid maxSameEventPerMinute', () => {
        const config: Config = { maxSameEventPerMinute: 60 };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should reject maxSameEventPerMinute of 0', () => {
        const config: Config = { maxSameEventPerMinute: 0 };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Max same event per minute must be a positive number');
      });

      it('should reject negative maxSameEventPerMinute', () => {
        const config: Config = { maxSameEventPerMinute: -10 };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
      });

      it('should reject non-number maxSameEventPerMinute', () => {
        expect(() => {
          validateAppConfig({ maxSameEventPerMinute: '60' as any });
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig({ maxSameEventPerMinute: true as any });
        }).toThrow(AppConfigValidationError);
      });

      it('should accept undefined maxSameEventPerMinute', () => {
        const config: Config = {};
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });
    });

    describe('Viewport Config Validation', () => {
      it('should accept valid viewport config', () => {
        const config: Config = {
          viewport: {
            elements: [{ selector: '.hero' }],
            threshold: 0.5,
            minDwellTime: 1000,
            cooldownPeriod: 60000,
            maxTrackedElements: 100,
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept viewport config with optional element properties', () => {
        const config: Config = {
          viewport: {
            elements: [
              { selector: '.hero', id: 'hero-1', name: 'Hero Banner' },
              { selector: '.cta', id: 'cta-1' },
              { selector: '.footer' },
            ],
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should reject null viewport config', () => {
        const config: Config = { viewport: null as any };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Viewport config must be an object');
      });

      it('should reject viewport config with missing elements', () => {
        const config: Config = { viewport: {} as any };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Viewport elements must be a non-empty array');
      });

      it('should reject viewport config with empty elements array', () => {
        const config: Config = { viewport: { elements: [] } };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Viewport elements must be a non-empty array');
      });

      it('should reject viewport element with missing selector', () => {
        const config: Config = {
          viewport: { elements: [{ selector: '' }] },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Each viewport element must have a valid selector string');
      });

      it('should reject viewport element with empty id', () => {
        const config: Config = {
          viewport: { elements: [{ selector: '.hero', id: '' }] },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Viewport element id must be a non-empty string');
      });

      it('should reject viewport element with empty name', () => {
        const config: Config = {
          viewport: { elements: [{ selector: '.hero', name: '   ' }] },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Viewport element name must be a non-empty string');
      });

      it('should reject viewport threshold below 0', () => {
        const config: Config = {
          viewport: { elements: [{ selector: '.hero' }], threshold: -0.1 },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Viewport threshold must be a number between 0 and 1');
      });

      it('should reject viewport threshold above 1', () => {
        const config: Config = {
          viewport: { elements: [{ selector: '.hero' }], threshold: 1.1 },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
      });

      it('should reject negative minDwellTime', () => {
        const config: Config = {
          viewport: { elements: [{ selector: '.hero' }], minDwellTime: -100 },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Viewport minDwellTime must be a non-negative number');
      });

      it('should reject negative cooldownPeriod', () => {
        const config: Config = {
          viewport: { elements: [{ selector: '.hero' }], cooldownPeriod: -1000 },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Viewport cooldownPeriod must be a non-negative number');
      });

      it('should reject maxTrackedElements of 0', () => {
        const config: Config = {
          viewport: { elements: [{ selector: '.hero' }], maxTrackedElements: 0 },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Viewport maxTrackedElements must be a positive number');
      });

      it('should reject negative maxTrackedElements', () => {
        const config: Config = {
          viewport: { elements: [{ selector: '.hero' }], maxTrackedElements: -10 },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
      });

      it('should accept viewport config with only required properties', () => {
        const config: Config = {
          viewport: { elements: [{ selector: '.hero' }] },
        };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept undefined viewport', () => {
        const config: Config = {};
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should reject duplicate selectors in viewport elements', () => {
        const config: Config = {
          viewport: {
            elements: [
              { selector: '.hero' },
              { selector: '.hero' }, // duplicate
            ],
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Duplicate viewport selector found: ".hero"');
      });

      it('should reject duplicate selectors with different whitespace', () => {
        const config: Config = {
          viewport: {
            elements: [
              { selector: '  .hero  ' },
              { selector: '.hero' }, // same after trim
            ],
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Duplicate viewport selector found: ".hero"');
      });

      it('should reject duplicate selectors with different identifiers', () => {
        const config: Config = {
          viewport: {
            elements: [
              { selector: '.hero', id: 'hero-1', name: 'Hero Banner 1' },
              { selector: '.hero', id: 'hero-2', name: 'Hero Banner 2' }, // duplicate selector
            ],
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Duplicate viewport selector found: ".hero"');
      });

      it('should accept different selectors', () => {
        const config: Config = {
          viewport: {
            elements: [{ selector: '.hero' }, { selector: '.cta' }, { selector: '#footer' }],
          },
        };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });
    });
  });

  describe('validateAndNormalizeConfig()', () => {
    describe('Normalization Behavior', () => {
      it('should set default globalMetadata to empty object', () => {
        const config: Config = {};
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.globalMetadata).toEqual({});
      });

      it('should preserve existing globalMetadata', () => {
        const metadata = { version: '1.0', build: 123 };
        const config: Config = { globalMetadata: metadata };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.globalMetadata).toEqual(metadata);
      });

      it('should set default sensitiveQueryParams to empty array', () => {
        const config: Config = {};
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.sensitiveQueryParams).toEqual([]);
      });

      it('should preserve existing sensitiveQueryParams', () => {
        const params = ['token', 'apiKey'];
        const config: Config = { sensitiveQueryParams: params };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.sensitiveQueryParams).toEqual(params);
      });

      it('should set default samplingRate to 1', () => {
        const config: Config = {};
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.samplingRate).toBe(1);
      });

      it('should preserve existing samplingRate', () => {
        const config: Config = { samplingRate: 0.5 };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.samplingRate).toBe(0.5);
      });

      it('should preserve samplingRate of 0', () => {
        const config: Config = { samplingRate: 0 };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.samplingRate).toBe(0);
      });

      it('should set default sessionTimeout to DEFAULT_SESSION_TIMEOUT (900000)', () => {
        const config: Config = {};
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.sessionTimeout).toBe(900000);
      });

      it('should preserve existing sessionTimeout', () => {
        const config: Config = { sessionTimeout: 600000 };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.sessionTimeout).toBe(600000);
      });

      it('should set default errorSampling to 1', () => {
        const config: Config = {};
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.errorSampling).toBe(1);
      });

      it('should preserve existing errorSampling', () => {
        const config: Config = { errorSampling: 0.5 };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.errorSampling).toBe(0.5);
      });

      it('should preserve errorSampling of 0', () => {
        const config: Config = { errorSampling: 0 };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.errorSampling).toBe(0);
      });

      it('should set default allowHttp to false in custom integration', () => {
        const config: Config = {
          integrations: {
            custom: { collectApiUrl: 'https://api.example.com/collect' },
          },
        };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.integrations?.custom?.allowHttp).toBe(false);
      });

      it('should preserve existing allowHttp in custom integration', () => {
        const config: Config = {
          integrations: {
            custom: { collectApiUrl: 'https://api.example.com/collect', allowHttp: true },
          },
        };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.integrations?.custom?.allowHttp).toBe(true);
      });

      it('should preserve all other config properties', () => {
        const config: Config = {
          sessionTimeout: 900000,
          errorSampling: 0.5,
          samplingRate: 0.8,
          integrations: {
            googleAnalytics: { measurementId: 'G-XXXXXXXXXX' },
          },
        };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.sessionTimeout).toBe(900000);
        expect(normalized.errorSampling).toBe(0.5);
        expect(normalized.samplingRate).toBe(0.8);
        expect(normalized.integrations).toEqual(config.integrations);
      });

      it('should set default pageViewThrottleMs to 1000', () => {
        const config: Config = {};
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.pageViewThrottleMs).toBe(1000);
      });

      it('should preserve existing pageViewThrottleMs', () => {
        const config: Config = { pageViewThrottleMs: 500 };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.pageViewThrottleMs).toBe(500);
      });

      it('should preserve pageViewThrottleMs of 0', () => {
        const config: Config = { pageViewThrottleMs: 0 };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.pageViewThrottleMs).toBe(0);
      });

      it('should set default clickThrottleMs to 300', () => {
        const config: Config = {};
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.clickThrottleMs).toBe(300);
      });

      it('should preserve existing clickThrottleMs', () => {
        const config: Config = { clickThrottleMs: 200 };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.clickThrottleMs).toBe(200);
      });

      it('should preserve clickThrottleMs of 0', () => {
        const config: Config = { clickThrottleMs: 0 };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.clickThrottleMs).toBe(0);
      });

      it('should set default maxSameEventPerMinute to 60', () => {
        const config: Config = {};
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.maxSameEventPerMinute).toBe(60);
      });

      it('should preserve existing maxSameEventPerMinute', () => {
        const config: Config = { maxSameEventPerMinute: 100 };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.maxSameEventPerMinute).toBe(100);
      });

      it('should normalize viewport config with defaults', () => {
        const config: Config = {
          viewport: {
            elements: [{ selector: '.hero' }],
          },
        };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.viewport?.threshold).toBe(0.5);
        expect(normalized.viewport?.minDwellTime).toBe(2000);
        expect(normalized.viewport?.cooldownPeriod).toBe(60000);
        expect(normalized.viewport?.maxTrackedElements).toBe(100);
      });

      it('should preserve existing viewport config values', () => {
        const config: Config = {
          viewport: {
            elements: [{ selector: '.hero', id: 'hero-1' }],
            threshold: 0.75,
            minDwellTime: 1500,
            cooldownPeriod: 30000,
            maxTrackedElements: 50,
          },
        };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.viewport?.elements).toEqual([{ selector: '.hero', id: 'hero-1' }]);
        expect(normalized.viewport?.threshold).toBe(0.75);
        expect(normalized.viewport?.minDwellTime).toBe(1500);
        expect(normalized.viewport?.cooldownPeriod).toBe(30000);
        expect(normalized.viewport?.maxTrackedElements).toBe(50);
      });

      it('should not normalize viewport if not provided', () => {
        const config: Config = {};
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.viewport).toBeUndefined();
      });
    });

    describe('Integration with validateAppConfig', () => {
      it('should validate all fields before normalization', () => {
        const config: Config = {
          sessionTimeout: -1000,
        };

        expect(() => validateAndNormalizeConfig(config)).toThrow(SessionTimeoutValidationError);
      });

      it('should reject invalid pageViewThrottleMs before normalization', () => {
        const config: Config = {
          pageViewThrottleMs: -100,
        };

        expect(() => validateAndNormalizeConfig(config)).toThrow(AppConfigValidationError);
      });

      it('should reject invalid viewport config before normalization', () => {
        const config: Config = {
          viewport: { elements: [] },
        };

        expect(() => validateAndNormalizeConfig(config)).toThrow(AppConfigValidationError);
      });
    });
  });
});
