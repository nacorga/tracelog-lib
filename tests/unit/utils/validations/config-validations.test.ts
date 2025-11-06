import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateAppConfig,
  validateAndNormalizeConfig,
} from '../../../../src/utils/validations/config-validations.utils';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../../helpers/setup.helper';
import {
  AppConfigValidationError,
  SessionTimeoutValidationError,
  SamplingRateValidationError,
  IntegrationValidationError,
} from '../../../../src/types';

describe('config-validations.utils', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('validateAppConfig', () => {
    describe('basic validation', () => {
      it('should accept undefined config', () => {
        expect(() => {
          validateAppConfig(undefined);
        }).not.toThrow();
      });

      it('should accept empty config object', () => {
        expect(() => {
          validateAppConfig({});
        }).not.toThrow();
      });

      it('should throw error for null config', () => {
        expect(() => {
          validateAppConfig(null as unknown as undefined);
        }).toThrow(AppConfigValidationError);
      });

      it('should throw error for non-object config', () => {
        expect(() => {
          validateAppConfig('invalid' as unknown as undefined);
        }).toThrow(AppConfigValidationError);
      });
    });

    describe('sessionTimeout validation', () => {
      it('should accept valid sessionTimeout', () => {
        expect(() => {
          validateAppConfig({ sessionTimeout: 600000 });
        }).not.toThrow();
      });

      it('should throw error for sessionTimeout below minimum', () => {
        expect(() => {
          validateAppConfig({ sessionTimeout: 1000 });
        }).toThrow(SessionTimeoutValidationError);
      });

      it('should throw error for sessionTimeout above maximum', () => {
        expect(() => {
          validateAppConfig({ sessionTimeout: 86400001 });
        }).toThrow(SessionTimeoutValidationError);
      });

      it('should throw error for non-number sessionTimeout', () => {
        expect(() => {
          validateAppConfig({ sessionTimeout: '600000' as unknown as number });
        }).toThrow(SessionTimeoutValidationError);
      });
    });

    describe('globalMetadata validation', () => {
      it('should accept valid globalMetadata object', () => {
        expect(() => {
          validateAppConfig({ globalMetadata: { key: 'value' } });
        }).not.toThrow();
      });

      it('should throw error for null globalMetadata', () => {
        expect(() => {
          validateAppConfig({ globalMetadata: null as any });
        }).toThrow(AppConfigValidationError);
      });

      it('should throw error for non-object globalMetadata', () => {
        expect(() => {
          validateAppConfig({ globalMetadata: 'invalid' as any });
        }).toThrow(AppConfigValidationError);
      });
    });

    describe('integrations validation', () => {
      describe('tracelog integration', () => {
        it('should accept valid tracelog projectId', () => {
          expect(() => {
            validateAppConfig({
              integrations: { tracelog: { projectId: 'valid-project-id' } },
            });
          }).not.toThrow();
        });

        it('should throw error for missing projectId', () => {
          expect(() => {
            validateAppConfig({
              integrations: { tracelog: { projectId: '' } },
            });
          }).toThrow(IntegrationValidationError);
        });

        it('should throw error for empty projectId', () => {
          expect(() => {
            validateAppConfig({
              integrations: { tracelog: { projectId: '   ' } },
            });
          }).toThrow(IntegrationValidationError);
        });

        it('should throw error for non-string projectId', () => {
          expect(() => {
            validateAppConfig({
              integrations: { tracelog: { projectId: 123 as unknown as string } },
            });
          }).toThrow(IntegrationValidationError);
        });
      });

      describe('custom integration', () => {
        it('should accept valid custom collectApiUrl with HTTPS', () => {
          expect(() => {
            validateAppConfig({
              integrations: { custom: { collectApiUrl: 'https://api.example.com/collect' } },
            });
          }).not.toThrow();
        });

        it('should accept HTTP with allowHttp flag', () => {
          expect(() => {
            validateAppConfig({
              integrations: { custom: { collectApiUrl: 'http://localhost:3000/collect', allowHttp: true } },
            });
          }).not.toThrow();
        });

        it('should throw error for missing collectApiUrl', () => {
          expect(() => {
            validateAppConfig({
              integrations: { custom: { collectApiUrl: '' } },
            });
          }).toThrow(IntegrationValidationError);
        });

        it('should throw error for empty collectApiUrl', () => {
          expect(() => {
            validateAppConfig({
              integrations: { custom: { collectApiUrl: '   ' } },
            });
          }).toThrow(IntegrationValidationError);
        });

        it('should throw error for HTTP without allowHttp flag', () => {
          expect(() => {
            validateAppConfig({
              integrations: { custom: { collectApiUrl: 'http://api.example.com/collect' } },
            });
          }).toThrow(IntegrationValidationError);
        });

        it('should throw error for URL without http/https protocol', () => {
          expect(() => {
            validateAppConfig({
              integrations: { custom: { collectApiUrl: 'ftp://api.example.com/collect' } },
            });
          }).toThrow(IntegrationValidationError);
        });

        it('should throw error for non-boolean allowHttp', () => {
          expect(() => {
            validateAppConfig({
              integrations: {
                custom: { collectApiUrl: 'https://api.example.com', allowHttp: 'true' as unknown as boolean },
              },
            });
          }).toThrow(IntegrationValidationError);
        });
      });
    });

    describe('sensitiveQueryParams validation', () => {
      it('should accept valid string array', () => {
        expect(() => {
          validateAppConfig({ sensitiveQueryParams: ['token', 'api_key'] });
        }).not.toThrow();
      });

      it('should throw error for non-array value', () => {
        expect(() => {
          validateAppConfig({ sensitiveQueryParams: 'token' as unknown as string[] });
        }).toThrow(AppConfigValidationError);
      });

      it('should throw error for array with non-string values', () => {
        expect(() => {
          validateAppConfig({ sensitiveQueryParams: ['token', 123] as unknown as string[] });
        }).toThrow(AppConfigValidationError);
      });
    });

    describe('samplingRate validation', () => {
      it('should accept valid samplingRate', () => {
        expect(() => {
          validateAppConfig({ samplingRate: 0.5 });
        }).not.toThrow();
      });

      it('should throw error for samplingRate below 0', () => {
        expect(() => {
          validateAppConfig({ samplingRate: -0.1 });
        }).toThrow(SamplingRateValidationError);
      });

      it('should throw error for samplingRate above 1', () => {
        expect(() => {
          validateAppConfig({ samplingRate: 1.5 });
        }).toThrow(SamplingRateValidationError);
      });

      it('should throw error for non-number samplingRate', () => {
        expect(() => {
          validateAppConfig({ samplingRate: '0.5' as unknown as number });
        }).toThrow(SamplingRateValidationError);
      });
    });

    describe('errorSampling validation', () => {
      it('should accept valid errorSampling', () => {
        expect(() => {
          validateAppConfig({ errorSampling: 0.5 });
        }).not.toThrow();
      });

      it('should throw error for errorSampling below 0', () => {
        expect(() => {
          validateAppConfig({ errorSampling: -0.1 });
        }).toThrow(SamplingRateValidationError);
      });

      it('should throw error for errorSampling above 1', () => {
        expect(() => {
          validateAppConfig({ errorSampling: 1.5 });
        }).toThrow(SamplingRateValidationError);
      });

      it('should throw error for non-number errorSampling', () => {
        expect(() => {
          validateAppConfig({ errorSampling: '0.5' as unknown as number });
        }).toThrow(SamplingRateValidationError);
      });
    });

    describe('disabledEvents validation', () => {
      it('should accept valid disableable event types', () => {
        expect(() => {
          validateAppConfig({ disabledEvents: ['scroll', 'web_vitals', 'error'] });
        }).not.toThrow();
      });

      it('should throw error for core event types', () => {
        expect(() => {
          validateAppConfig({ disabledEvents: ['page_view'] as any });
        }).toThrow(AppConfigValidationError);
      });

      it('should throw error for non-array value', () => {
        expect(() => {
          validateAppConfig({ disabledEvents: 'scroll' as any });
        }).toThrow(AppConfigValidationError);
      });

      it('should throw error for invalid event type', () => {
        expect(() => {
          validateAppConfig({ disabledEvents: ['invalid_event'] as any });
        }).toThrow(AppConfigValidationError);
      });
    });
  });

  describe('validateAndNormalizeConfig', () => {
    it('should return default config for undefined input', () => {
      const normalized = validateAndNormalizeConfig(undefined);
      expect(normalized).toBeDefined();
      expect(normalized.sessionTimeout).toBeDefined();
      expect(normalized.samplingRate).toBeDefined();
    });

    it('should normalize config with defaults', () => {
      const normalized = validateAndNormalizeConfig({});
      expect(normalized.sessionTimeout).toBeDefined();
      expect(normalized.samplingRate).toBeDefined();
      expect(normalized.errorSampling).toBeDefined();
    });

    it('should preserve custom values during normalization', () => {
      const customConfig = {
        sessionTimeout: 600000,
        samplingRate: 0.5,
        globalMetadata: { app: 'test' },
      };
      const normalized = validateAndNormalizeConfig(customConfig);
      expect(normalized.sessionTimeout).toBe(600000);
      expect(normalized.samplingRate).toBe(0.5);
      expect(normalized.globalMetadata).toEqual({ app: 'test' });
    });

    it('should validate before normalizing', () => {
      expect(() => validateAndNormalizeConfig({ sessionTimeout: 1000 })).toThrow(SessionTimeoutValidationError);
    });
  });
});
