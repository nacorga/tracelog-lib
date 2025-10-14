/**
 * Web Vitals Configuration Edge Cases Tests
 * Tests for webVitalsMode and webVitalsThresholds configuration validation
 */

import { describe, it, expect } from 'vitest';
import { validateAppConfig } from '../../../src/utils/validations/config-validations.utils';
import type { Config } from '../../../src/types';

describe('Web Vitals Configuration - Edge Cases', () => {
  describe('webVitalsMode validation', () => {
    it('should accept valid modes', () => {
      expect(() => {
        validateAppConfig({ webVitalsMode: 'all' });
      }).not.toThrow();
      expect(() => {
        validateAppConfig({ webVitalsMode: 'needs-improvement' });
      }).not.toThrow();
      expect(() => {
        validateAppConfig({ webVitalsMode: 'poor' });
      }).not.toThrow();
    });

    it('should reject invalid string modes', () => {
      expect(() => {
        validateAppConfig({ webVitalsMode: 'invalid' as any });
      }).toThrow('Invalid webVitalsMode: "invalid"');
      expect(() => {
        validateAppConfig({ webVitalsMode: 'good' as any });
      }).toThrow('Invalid webVitalsMode: "good"');
      expect(() => {
        validateAppConfig({ webVitalsMode: '' as any });
      }).toThrow('Invalid webVitalsMode: ""');
    });

    it('should reject non-string types', () => {
      expect(() => {
        validateAppConfig({ webVitalsMode: 123 as any });
      }).toThrow();
      expect(() => {
        validateAppConfig({ webVitalsMode: true as any });
      }).toThrow();
      expect(() => {
        validateAppConfig({ webVitalsMode: null as any });
      }).toThrow();
      expect(() => {
        validateAppConfig({ webVitalsMode: {} as any });
      }).toThrow();
      expect(() => {
        validateAppConfig({ webVitalsMode: [] as any });
      }).toThrow();
    });

    it('should accept undefined (uses default)', () => {
      expect(() => {
        validateAppConfig({ webVitalsMode: undefined });
      }).not.toThrow();
      expect(() => {
        validateAppConfig({});
      }).not.toThrow();
    });
  });

  describe('webVitalsThresholds validation', () => {
    it('should accept valid thresholds', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            LCP: 3000,
            FCP: 2000,
          },
        });
      }).not.toThrow();
    });

    it('should accept all valid metric keys', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            LCP: 3000,
            FCP: 2000,
            CLS: 0.2,
            INP: 300,
            TTFB: 1000,
            LONG_TASK: 100,
          },
        });
      }).not.toThrow();
    });

    it('should reject invalid metric keys', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            INVALID: 1000,
          } as any,
        });
      }).toThrow('Invalid Web Vitals threshold key: "INVALID"');

      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            lcp: 1000, // lowercase
          } as any,
        });
      }).toThrow('Invalid Web Vitals threshold key: "lcp"');
    });

    it('should reject null', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: null as any,
        });
      }).toThrow('webVitalsThresholds must be an object');
    });

    it('should reject arrays', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: [{ LCP: 2500 }] as any,
        });
      }).toThrow('webVitalsThresholds must be an object');
    });

    it('should reject negative values', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            LCP: -1000,
          },
        });
      }).toThrow('Invalid Web Vitals threshold value for LCP: -1000');
    });

    it('should reject NaN', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            LCP: NaN,
          },
        });
      }).toThrow('Invalid Web Vitals threshold value for LCP: NaN');
    });

    it('should reject Infinity', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            LCP: Infinity,
          },
        });
      }).toThrow('Invalid Web Vitals threshold value for LCP: Infinity');

      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            LCP: -Infinity,
          },
        });
      }).toThrow('Invalid Web Vitals threshold value for LCP: -Infinity');
    });

    it('should reject non-number values', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            LCP: '3000' as any,
          },
        });
      }).toThrow('Invalid Web Vitals threshold value for LCP: 3000');

      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            LCP: true as any,
          },
        });
      }).toThrow('Invalid Web Vitals threshold value for LCP: true');

      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            LCP: null as any,
          },
        });
      }).toThrow('Invalid Web Vitals threshold value for LCP: null');
    });

    it('should accept empty object (no-op)', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {},
        });
      }).not.toThrow();
    });

    it('should accept zero thresholds', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            LCP: 0,
            FCP: 0,
          },
        });
      }).not.toThrow();
    });

    it('should accept undefined (uses defaults)', () => {
      expect(() => {
        validateAppConfig({ webVitalsThresholds: undefined });
      }).not.toThrow();
      expect(() => {
        validateAppConfig({});
      }).not.toThrow();
    });
  });

  describe('Combined configuration', () => {
    it('should accept mode + thresholds together', () => {
      expect(() => {
        validateAppConfig({
          webVitalsMode: 'needs-improvement',
          webVitalsThresholds: {
            LCP: 3000,
          },
        });
      }).not.toThrow();
    });

    it('should accept mode=all with custom thresholds (thresholds override)', () => {
      expect(() => {
        validateAppConfig({
          webVitalsMode: 'all',
          webVitalsThresholds: {
            LCP: 5000, // Custom threshold overrides mode
          },
        });
      }).not.toThrow();
    });

    it('should validate both independently', () => {
      expect(() => {
        validateAppConfig({
          webVitalsMode: 'invalid' as any,
          webVitalsThresholds: {
            LCP: 3000,
          },
        });
      }).toThrow('Invalid webVitalsMode');

      expect(() => {
        validateAppConfig({
          webVitalsMode: 'all',
          webVitalsThresholds: {
            INVALID: 3000,
          } as any,
        });
      }).toThrow('Invalid Web Vitals threshold key');
    });
  });

  describe('Extreme values', () => {
    it('should accept very large numbers', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            LCP: 999999999,
          },
        });
      }).not.toThrow();
    });

    it('should accept very small decimal numbers', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            CLS: 0.0001,
          },
        });
      }).not.toThrow();
    });

    it('should accept Number.MAX_SAFE_INTEGER', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            LCP: Number.MAX_SAFE_INTEGER,
          },
        });
      }).not.toThrow();
    });

    it('should accept Number.MIN_VALUE (smallest positive)', () => {
      expect(() => {
        validateAppConfig({
          webVitalsThresholds: {
            CLS: Number.MIN_VALUE,
          },
        });
      }).not.toThrow();
    });
  });

  describe('Integration with other config', () => {
    it('should work alongside other configuration options', () => {
      expect(() => {
        validateAppConfig({
          sessionTimeout: 600000,
          samplingRate: 0.5,
          webVitalsMode: 'poor',
          webVitalsThresholds: {
            LCP: 5000,
          },
          globalMetadata: {
            env: 'production',
          },
        } as Config);
      }).not.toThrow();
    });
  });
});
