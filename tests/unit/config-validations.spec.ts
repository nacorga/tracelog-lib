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
          scrollContainerSelectors: ['.container'],
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

    describe('Scroll Container Selectors Validation', () => {
      it('should accept valid single selector', () => {
        const config: Config = { scrollContainerSelectors: ['.container'] };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept multiple valid selectors', () => {
        const config: Config = {
          scrollContainerSelectors: ['.container', '#main', '[data-scroll="true"]'],
        };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should accept complex CSS selectors without child combinator', () => {
        const config: Config = {
          scrollContainerSelectors: [
            '.container .nested',
            '#main .content',
            '[data-scroll="true"]',
            'div:nth-child(2)',
            '.parent + .sibling',
            '.parent ~ .sibling',
          ],
        };
        expect(() => {
          validateAppConfig(config);
        }).not.toThrow();
      });

      it('should reject selector with > character (XSS prevention)', () => {
        const config: Config = { scrollContainerSelectors: ['.container > div'] };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
      });

      it('should reject selector with < character (XSS prevention)', () => {
        const config: Config = { scrollContainerSelectors: ['.container < div'] };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
      });

      it('should reject empty string selector', () => {
        const config: Config = { scrollContainerSelectors: [''] };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
      });

      it('should reject whitespace-only selector', () => {
        const config: Config = { scrollContainerSelectors: ['   '] };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
      });

      it('should reject non-string selector', () => {
        const config: Config = { scrollContainerSelectors: [123 as any] };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
      });

      it('should reject selector with potential XSS - script tag', () => {
        const config: Config = { scrollContainerSelectors: ['<script>alert(1)</script>'] };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
        expect(() => {
          validateAppConfig(config);
        }).toThrow('Invalid or potentially unsafe CSS selector');
      });

      it('should reject selector with potential XSS - event handler', () => {
        const config: Config = { scrollContainerSelectors: ['div onclick=alert(1)'] };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
      });

      it('should reject selector with unbalanced parentheses', () => {
        const config: Config = { scrollContainerSelectors: ['div:nth-child(2'] };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
      });

      it('should reject selector with unbalanced brackets', () => {
        const config: Config = { scrollContainerSelectors: ['[data-scroll="true"'] };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
      });

      it('should reject selector with invalid characters', () => {
        const config: Config = { scrollContainerSelectors: ['div$invalid'] };
        expect(() => {
          validateAppConfig(config);
        }).toThrow(AppConfigValidationError);
      });

      it('should accept undefined selectors', () => {
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
          scrollContainerSelectors: ['.container'],
          integrations: {
            googleAnalytics: { measurementId: 'G-XXXXXXXXXX' },
          },
        };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.sessionTimeout).toBe(900000);
        expect(normalized.errorSampling).toBe(0.5);
        expect(normalized.samplingRate).toBe(0.8);
        expect(normalized.scrollContainerSelectors).toEqual(['.container']);
        expect(normalized.integrations).toEqual(config.integrations);
      });
    });

    describe('Integration with validateAppConfig', () => {
      it('should validate all fields before normalization', () => {
        const config: Config = {
          sessionTimeout: -1000,
        };

        expect(() => validateAndNormalizeConfig(config)).toThrow(SessionTimeoutValidationError);
      });
    });
  });
});
