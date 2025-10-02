import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateAppConfig,
  validateAndNormalizeConfig,
  isValidConfigApiResponse,
} from '@/utils/validations/config-validations.utils';
import { AppConfig, Mode } from '@/types';
import {
  ProjectIdValidationError,
  AppConfigValidationError,
  SessionTimeoutValidationError,
  SamplingRateValidationError,
  IntegrationValidationError,
} from '@/types/validation-error.types';
import { MIN_SESSION_TIMEOUT_MS, MAX_SESSION_TIMEOUT_MS } from '@/constants';

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
        const config: AppConfig = { id: 'test-project-id' };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should validate complete valid config', () => {
        const config: AppConfig = {
          id: 'test-project-id',
          sessionTimeout: 900000,
          globalMetadata: { version: '1.0' },
          scrollContainerSelectors: ['.container'],
          sensitiveQueryParams: ['token', 'key'],
          errorSampling: 0.5,
        };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should reject null config', () => {
        expect(() => validateAppConfig(null as any)).toThrow(AppConfigValidationError);
        expect(() => validateAppConfig(null as any)).toThrow('Configuration must be an object');
      });

      it('should reject undefined config', () => {
        expect(() => validateAppConfig(undefined as any)).toThrow(AppConfigValidationError);
      });

      it('should reject non-object config', () => {
        expect(() => validateAppConfig('not-object' as any)).toThrow(AppConfigValidationError);
        expect(() => validateAppConfig(123 as any)).toThrow(AppConfigValidationError);
        expect(() => validateAppConfig(true as any)).toThrow(AppConfigValidationError);
      });

      it('should reject config without id property', () => {
        const config = {} as AppConfig;
        expect(() => validateAppConfig(config)).toThrow(ProjectIdValidationError);
      });
    });

    describe('Project ID Validation', () => {
      it('should reject null project id', () => {
        const config: AppConfig = { id: null as any };
        expect(() => validateAppConfig(config)).toThrow(ProjectIdValidationError);
      });

      it('should reject undefined project id', () => {
        const config: AppConfig = { id: undefined as any };
        expect(() => validateAppConfig(config)).toThrow(ProjectIdValidationError);
      });

      it('should reject non-string project id', () => {
        expect(() => validateAppConfig({ id: 123 as any })).toThrow(ProjectIdValidationError);
        expect(() => validateAppConfig({ id: true as any })).toThrow(ProjectIdValidationError);
        expect(() => validateAppConfig({ id: {} as any })).toThrow(ProjectIdValidationError);
      });

      it('should accept empty string project id (normalized later)', () => {
        const config: AppConfig = { id: '' };
        // validateAppConfig allows empty string (normalization catches it)
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should accept whitespace-only project id (normalized later)', () => {
        const config: AppConfig = { id: '   ' };
        // validateAppConfig allows whitespace (normalization catches it)
        expect(() => validateAppConfig(config)).not.toThrow();
      });
    });

    describe('Session Timeout Validation', () => {
      it('should accept valid session timeout', () => {
        const config: AppConfig = { id: 'test-id', sessionTimeout: 900000 };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should accept minimum session timeout', () => {
        const config: AppConfig = { id: 'test-id', sessionTimeout: MIN_SESSION_TIMEOUT_MS };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should accept maximum session timeout', () => {
        const config: AppConfig = { id: 'test-id', sessionTimeout: MAX_SESSION_TIMEOUT_MS };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should reject session timeout below minimum', () => {
        const config: AppConfig = { id: 'test-id', sessionTimeout: MIN_SESSION_TIMEOUT_MS - 1 };
        expect(() => validateAppConfig(config)).toThrow(SessionTimeoutValidationError);
      });

      it('should reject session timeout above maximum', () => {
        const config: AppConfig = { id: 'test-id', sessionTimeout: MAX_SESSION_TIMEOUT_MS + 1 };
        expect(() => validateAppConfig(config)).toThrow(SessionTimeoutValidationError);
      });

      it('should reject non-number session timeout', () => {
        expect(() => validateAppConfig({ id: 'test-id', sessionTimeout: '900000' as any })).toThrow(
          SessionTimeoutValidationError,
        );
        expect(() => validateAppConfig({ id: 'test-id', sessionTimeout: true as any })).toThrow(
          SessionTimeoutValidationError,
        );
      });

      it('should reject negative session timeout', () => {
        const config: AppConfig = { id: 'test-id', sessionTimeout: -1000 };
        expect(() => validateAppConfig(config)).toThrow(SessionTimeoutValidationError);
      });

      it('should accept undefined session timeout', () => {
        const config: AppConfig = { id: 'test-id' };
        expect(() => validateAppConfig(config)).not.toThrow();
      });
    });

    describe('Global Metadata Validation', () => {
      it('should accept valid object metadata', () => {
        const config: AppConfig = {
          id: 'test-id',
          globalMetadata: { version: '1.0', build: 123 },
        };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should accept empty object metadata', () => {
        const config: AppConfig = { id: 'test-id', globalMetadata: {} };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should reject null metadata', () => {
        const config: AppConfig = { id: 'test-id', globalMetadata: null as any };
        expect(() => validateAppConfig(config)).toThrow(AppConfigValidationError);
        expect(() => validateAppConfig(config)).toThrow('Global metadata must be an object');
      });

      it('should reject non-object metadata', () => {
        expect(() => validateAppConfig({ id: 'test-id', globalMetadata: 'string' as any })).toThrow(
          AppConfigValidationError,
        );
        expect(() => validateAppConfig({ id: 'test-id', globalMetadata: 123 as any })).toThrow(
          AppConfigValidationError,
        );
        expect(() => validateAppConfig({ id: 'test-id', globalMetadata: true as any })).toThrow(
          AppConfigValidationError,
        );
      });

      it('should accept undefined metadata', () => {
        const config: AppConfig = { id: 'test-id' };
        expect(() => validateAppConfig(config)).not.toThrow();
      });
    });

    describe('Scroll Container Selectors Validation', () => {
      it('should accept valid single selector', () => {
        const config: AppConfig = { id: 'test-id', scrollContainerSelectors: ['.container'] };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should accept multiple valid selectors', () => {
        const config: AppConfig = {
          id: 'test-id',
          scrollContainerSelectors: ['.container', '#main', '[data-scroll="true"]'],
        };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should accept complex CSS selectors without child combinator', () => {
        const config: AppConfig = {
          id: 'test-id',
          scrollContainerSelectors: [
            '.container .nested',
            '#main .content',
            '[data-scroll="true"]',
            'div:nth-child(2)',
            '.parent + .sibling',
            '.parent ~ .sibling',
          ],
        };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should reject selector with > character (XSS prevention)', () => {
        const config: AppConfig = { id: 'test-id', scrollContainerSelectors: ['.container > div'] };
        expect(() => validateAppConfig(config)).toThrow(AppConfigValidationError);
      });

      it('should reject selector with < character (XSS prevention)', () => {
        const config: AppConfig = { id: 'test-id', scrollContainerSelectors: ['.container < div'] };
        expect(() => validateAppConfig(config)).toThrow(AppConfigValidationError);
      });

      it('should reject empty string selector', () => {
        const config: AppConfig = { id: 'test-id', scrollContainerSelectors: [''] };
        expect(() => validateAppConfig(config)).toThrow(AppConfigValidationError);
      });

      it('should reject whitespace-only selector', () => {
        const config: AppConfig = { id: 'test-id', scrollContainerSelectors: ['   '] };
        expect(() => validateAppConfig(config)).toThrow(AppConfigValidationError);
      });

      it('should reject non-string selector', () => {
        const config: AppConfig = { id: 'test-id', scrollContainerSelectors: [123 as any] };
        expect(() => validateAppConfig(config)).toThrow(AppConfigValidationError);
      });

      it('should reject selector with potential XSS - script tag', () => {
        const config: AppConfig = { id: 'test-id', scrollContainerSelectors: ['<script>alert(1)</script>'] };
        expect(() => validateAppConfig(config)).toThrow(AppConfigValidationError);
        expect(() => validateAppConfig(config)).toThrow('Invalid or potentially unsafe CSS selector');
      });

      it('should reject selector with potential XSS - event handler', () => {
        const config: AppConfig = { id: 'test-id', scrollContainerSelectors: ['div onclick=alert(1)'] };
        expect(() => validateAppConfig(config)).toThrow(AppConfigValidationError);
      });

      it('should reject selector with unbalanced parentheses', () => {
        const config: AppConfig = { id: 'test-id', scrollContainerSelectors: ['div:nth-child(2'] };
        expect(() => validateAppConfig(config)).toThrow(AppConfigValidationError);
      });

      it('should reject selector with unbalanced brackets', () => {
        const config: AppConfig = { id: 'test-id', scrollContainerSelectors: ['[data-scroll="true"'] };
        expect(() => validateAppConfig(config)).toThrow(AppConfigValidationError);
      });

      it('should reject selector with invalid characters', () => {
        const config: AppConfig = { id: 'test-id', scrollContainerSelectors: ['div$invalid'] };
        expect(() => validateAppConfig(config)).toThrow(AppConfigValidationError);
      });

      it('should accept undefined selectors', () => {
        const config: AppConfig = { id: 'test-id' };
        expect(() => validateAppConfig(config)).not.toThrow();
      });
    });

    describe('Sensitive Query Params Validation', () => {
      it('should accept valid query params array', () => {
        const config: AppConfig = {
          id: 'test-id',
          sensitiveQueryParams: ['token', 'apiKey', 'password'],
        };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should accept empty array', () => {
        const config: AppConfig = { id: 'test-id', sensitiveQueryParams: [] };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should reject non-array', () => {
        expect(() => validateAppConfig({ id: 'test-id', sensitiveQueryParams: 'token' as any })).toThrow(
          AppConfigValidationError,
        );
        expect(() => validateAppConfig({ id: 'test-id', sensitiveQueryParams: {} as any })).toThrow(
          AppConfigValidationError,
        );
      });

      it('should reject array with non-string values', () => {
        const config: AppConfig = {
          id: 'test-id',
          sensitiveQueryParams: ['token', 123 as any, 'password'],
        };
        expect(() => validateAppConfig(config)).toThrow(AppConfigValidationError);
        expect(() => validateAppConfig(config)).toThrow('All sensitive query params must be strings');
      });

      it('should accept undefined', () => {
        const config: AppConfig = { id: 'test-id' };
        expect(() => validateAppConfig(config)).not.toThrow();
      });
    });

    describe('Error Sampling Validation', () => {
      it('should accept valid sampling rate 0', () => {
        const config: AppConfig = { id: 'test-id', errorSampling: 0 };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should accept valid sampling rate 1', () => {
        const config: AppConfig = { id: 'test-id', errorSampling: 1 };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should accept valid sampling rate 0.5', () => {
        const config: AppConfig = { id: 'test-id', errorSampling: 0.5 };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should reject negative sampling rate', () => {
        const config: AppConfig = { id: 'test-id', errorSampling: -0.1 };
        expect(() => validateAppConfig(config)).toThrow(SamplingRateValidationError);
      });

      it('should reject sampling rate above 1', () => {
        const config: AppConfig = { id: 'test-id', errorSampling: 1.1 };
        expect(() => validateAppConfig(config)).toThrow(SamplingRateValidationError);
      });

      it('should reject non-number sampling rate', () => {
        expect(() => validateAppConfig({ id: 'test-id', errorSampling: '0.5' as any })).toThrow(
          SamplingRateValidationError,
        );
        expect(() => validateAppConfig({ id: 'test-id', errorSampling: true as any })).toThrow(
          SamplingRateValidationError,
        );
      });

      it('should accept undefined', () => {
        const config: AppConfig = { id: 'test-id' };
        expect(() => validateAppConfig(config)).not.toThrow();
      });
    });

    describe('Google Analytics Integration Validation', () => {
      it('should accept valid Google Analytics 4 measurement ID', () => {
        const config: AppConfig = {
          id: 'test-id',
          integrations: {
            googleAnalytics: { measurementId: 'G-XXXXXXXXXX' },
          },
        };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should accept valid Universal Analytics ID', () => {
        const config: AppConfig = {
          id: 'test-id',
          integrations: {
            googleAnalytics: { measurementId: 'UA-XXXXXXXXX-X' },
          },
        };
        expect(() => validateAppConfig(config)).not.toThrow();
      });

      it('should reject empty measurement ID', () => {
        const config: AppConfig = {
          id: 'test-id',
          integrations: {
            googleAnalytics: { measurementId: '' },
          },
        };
        expect(() => validateAppConfig(config)).toThrow(IntegrationValidationError);
      });

      it('should reject whitespace-only measurement ID', () => {
        const config: AppConfig = {
          id: 'test-id',
          integrations: {
            googleAnalytics: { measurementId: '   ' },
          },
        };
        expect(() => validateAppConfig(config)).toThrow(IntegrationValidationError);
      });

      it('should reject measurement ID without G- or UA- prefix', () => {
        const config: AppConfig = {
          id: 'test-id',
          integrations: {
            googleAnalytics: { measurementId: 'XXXXXXXXXX' },
          },
        };
        expect(() => validateAppConfig(config)).toThrow(IntegrationValidationError);
        expect(() => validateAppConfig(config)).toThrow('must start with "G-" or "UA-"');
      });

      it('should reject non-string measurement ID', () => {
        const config: AppConfig = {
          id: 'test-id',
          integrations: {
            googleAnalytics: { measurementId: 123 as any },
          },
        };
        expect(() => validateAppConfig(config)).toThrow(IntegrationValidationError);
      });

      it('should reject null measurement ID', () => {
        const config: AppConfig = {
          id: 'test-id',
          integrations: {
            googleAnalytics: { measurementId: null as any },
          },
        };
        expect(() => validateAppConfig(config)).toThrow(IntegrationValidationError);
      });

      it('should accept undefined integrations', () => {
        const config: AppConfig = { id: 'test-id' };
        expect(() => validateAppConfig(config)).not.toThrow();
      });
    });
  });

  describe('validateAndNormalizeConfig()', () => {
    describe('Normalization Behavior', () => {
      it('should trim project ID', () => {
        const config: AppConfig = { id: '  test-project-id  ' };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.id).toBe('test-project-id');
      });

      it('should set default globalMetadata to empty object', () => {
        const config: AppConfig = { id: 'test-id' };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.globalMetadata).toEqual({});
      });

      it('should preserve existing globalMetadata', () => {
        const metadata = { version: '1.0', build: 123 };
        const config: AppConfig = { id: 'test-id', globalMetadata: metadata };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.globalMetadata).toEqual(metadata);
      });

      it('should set default sensitiveQueryParams to empty array', () => {
        const config: AppConfig = { id: 'test-id' };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.sensitiveQueryParams).toEqual([]);
      });

      it('should preserve existing sensitiveQueryParams', () => {
        const params = ['token', 'apiKey'];
        const config: AppConfig = { id: 'test-id', sensitiveQueryParams: params };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.sensitiveQueryParams).toEqual(params);
      });

      it('should preserve all other config properties', () => {
        const config: AppConfig = {
          id: 'test-id',
          sessionTimeout: 900000,
          errorSampling: 0.5,
          scrollContainerSelectors: ['.container'],
          integrations: {
            googleAnalytics: { measurementId: 'G-XXXXXXXXXX' },
          },
        };
        const normalized = validateAndNormalizeConfig(config);
        expect(normalized.sessionTimeout).toBe(900000);
        expect(normalized.errorSampling).toBe(0.5);
        expect(normalized.scrollContainerSelectors).toEqual(['.container']);
        expect(normalized.integrations).toEqual(config.integrations);
      });
    });

    describe('Post-Normalization Validation', () => {
      it('should reject empty string after trimming', () => {
        const config: AppConfig = { id: '   ' };
        expect(() => validateAndNormalizeConfig(config)).toThrow(ProjectIdValidationError);
      });

      it('should provide specific error for whitespace-only ID', () => {
        const config: AppConfig = { id: '   ' };
        try {
          validateAndNormalizeConfig(config);
          expect.fail('Should have thrown ProjectIdValidationError');
        } catch (error) {
          expect(error).toBeInstanceOf(ProjectIdValidationError);
        }
      });
    });

    describe('Integration with validateAppConfig', () => {
      it('should reject invalid config before normalization', () => {
        const config: AppConfig = { id: null as any };
        expect(() => validateAndNormalizeConfig(config)).toThrow(ProjectIdValidationError);
      });

      it('should validate all fields before normalization', () => {
        const config: AppConfig = {
          id: 'test-id',
          sessionTimeout: -1000,
        };
        expect(() => validateAndNormalizeConfig(config)).toThrow(SessionTimeoutValidationError);
      });
    });
  });

  describe('isValidConfigApiResponse()', () => {
    describe('Valid API Responses', () => {
      it('should accept empty object (all fields optional)', () => {
        expect(isValidConfigApiResponse({})).toBe(true);
      });

      it('should accept valid mode QA', () => {
        expect(isValidConfigApiResponse({ mode: Mode.QA })).toBe(true);
      });

      it('should accept valid mode DEBUG', () => {
        expect(isValidConfigApiResponse({ mode: Mode.DEBUG })).toBe(true);
      });

      it('should accept undefined mode', () => {
        expect(isValidConfigApiResponse({ mode: undefined })).toBe(true);
      });

      it('should accept valid samplingRate 0', () => {
        expect(isValidConfigApiResponse({ samplingRate: 0 })).toBe(true);
      });

      it('should accept valid samplingRate 1', () => {
        expect(isValidConfigApiResponse({ samplingRate: 1 })).toBe(true);
      });

      it('should accept valid samplingRate 0.5', () => {
        expect(isValidConfigApiResponse({ samplingRate: 0.5 })).toBe(true);
      });

      it('should accept undefined samplingRate', () => {
        expect(isValidConfigApiResponse({ samplingRate: undefined })).toBe(true);
      });

      it('should accept empty tags array', () => {
        expect(isValidConfigApiResponse({ tags: [] })).toBe(true);
      });

      it('should accept tags array with items', () => {
        expect(isValidConfigApiResponse({ tags: ['tag1', 'tag2'] })).toBe(true);
      });

      it('should accept undefined tags', () => {
        expect(isValidConfigApiResponse({ tags: undefined })).toBe(true);
      });

      it('should accept empty excludedUrlPaths array', () => {
        expect(isValidConfigApiResponse({ excludedUrlPaths: [] })).toBe(true);
      });

      it('should accept excludedUrlPaths with items', () => {
        expect(isValidConfigApiResponse({ excludedUrlPaths: ['/admin', '/private'] })).toBe(true);
      });

      it('should accept undefined excludedUrlPaths', () => {
        expect(isValidConfigApiResponse({ excludedUrlPaths: undefined })).toBe(true);
      });

      it('should accept ipExcluded true', () => {
        expect(isValidConfigApiResponse({ ipExcluded: true })).toBe(true);
      });

      it('should accept ipExcluded false', () => {
        expect(isValidConfigApiResponse({ ipExcluded: false })).toBe(true);
      });

      it('should accept undefined ipExcluded', () => {
        expect(isValidConfigApiResponse({ ipExcluded: undefined })).toBe(true);
      });

      it('should accept complete valid config', () => {
        const config = {
          mode: Mode.QA,
          samplingRate: 0.5,
          tags: ['tag1', 'tag2'],
          excludedUrlPaths: ['/admin'],
          ipExcluded: false,
        };
        expect(isValidConfigApiResponse(config)).toBe(true);
      });
    });

    describe('Invalid API Responses', () => {
      it('should reject null', () => {
        expect(isValidConfigApiResponse(null)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(isValidConfigApiResponse(undefined)).toBe(false);
      });

      it('should reject non-object primitives', () => {
        expect(isValidConfigApiResponse('string')).toBe(false);
        expect(isValidConfigApiResponse(123)).toBe(false);
        expect(isValidConfigApiResponse(true)).toBe(false);
      });

      it('should reject invalid mode string', () => {
        expect(isValidConfigApiResponse({ mode: 'INVALID_MODE' })).toBe(false);
      });

      it('should reject invalid mode number', () => {
        expect(isValidConfigApiResponse({ mode: 999 })).toBe(false);
      });

      it('should reject negative samplingRate', () => {
        expect(isValidConfigApiResponse({ samplingRate: -0.1 })).toBe(false);
      });

      it('should reject samplingRate above 1', () => {
        expect(isValidConfigApiResponse({ samplingRate: 1.1 })).toBe(false);
      });

      it('should reject non-number samplingRate', () => {
        expect(isValidConfigApiResponse({ samplingRate: '0.5' })).toBe(false);
      });

      it('should reject non-array tags', () => {
        expect(isValidConfigApiResponse({ tags: 'not-array' })).toBe(false);
        expect(isValidConfigApiResponse({ tags: {} })).toBe(false);
      });

      it('should reject non-array excludedUrlPaths', () => {
        expect(isValidConfigApiResponse({ excludedUrlPaths: 'not-array' })).toBe(false);
        expect(isValidConfigApiResponse({ excludedUrlPaths: {} })).toBe(false);
      });

      it('should reject non-boolean ipExcluded', () => {
        expect(isValidConfigApiResponse({ ipExcluded: 'true' })).toBe(false);
        expect(isValidConfigApiResponse({ ipExcluded: 1 })).toBe(false);
      });

      it('should reject config with any invalid field', () => {
        const config = {
          mode: Mode.QA,
          samplingRate: 0.5,
          tags: 'not-array', // Invalid
          excludedUrlPaths: ['/admin'],
          ipExcluded: false,
        };
        expect(isValidConfigApiResponse(config)).toBe(false);
      });
    });

    describe('Error Handling', () => {
      it('should handle objects with extra properties gracefully', () => {
        const objWithExtra = {
          mode: Mode.QA,
          samplingRate: 0.5,
          extraProperty: 'ignored',
        };
        // Extra properties don't cause validation to fail
        expect(isValidConfigApiResponse(objWithExtra)).toBe(true);
      });

      it('should handle objects with getters that throw', () => {
        const obj = {
          get mode() {
            throw new Error('Getter error');
          },
        };
        expect(isValidConfigApiResponse(obj)).toBe(false);
      });
    });
  });
});
