/**
 * Security tests for api.ts
 * Validates that internal functions are properly protected
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { __setAppInstance } from '../../src/api';
import { App } from '../../src/app';

describe('API Security', () => {
  describe('__setAppInstance protection', () => {
    // Clean up state before and after each test
    beforeEach(() => {
      __setAppInstance(null);
    });

    afterEach(() => {
      __setAppInstance(null);
    });

    it('should be available in dev mode', () => {
      // In dev mode (process.env.NODE_ENV === 'dev'), __setAppInstance should exist
      expect(__setAppInstance).toBeDefined();
      expect(typeof __setAppInstance).toBe('function');
    });

    it('should reject non-App instances', () => {
      const fakeApp = { fake: true };

      expect(() => {
        __setAppInstance(fakeApp as any);
      }).toThrow('Invalid app instance type');
    });

    it('should accept null to clear instance', () => {
      expect(() => {
        __setAppInstance(null);
      }).not.toThrow();
    });

    it('should prevent overwriting existing instance', () => {
      const app1 = new App();
      const app2 = new App();

      // Set first instance
      __setAppInstance(app1);

      // Trying to set different instance should fail
      expect(() => {
        __setAppInstance(app2);
      }).toThrow('Cannot overwrite existing app instance');

      // afterEach will clean up
    });

    it('should allow setting same instance multiple times', () => {
      const app = new App();

      __setAppInstance(app);

      // Setting same instance should work
      expect(() => {
        __setAppInstance(app);
      }).not.toThrow();

      // afterEach will clean up
    });
  });
});
