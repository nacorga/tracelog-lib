import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDeviceType } from '../../../../src/utils/browser/device-detector.utils';
import { DeviceType } from '../../../../src/types/device.types';

describe('Device Detector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDeviceType', () => {
    it('should detect mobile from userAgentData when available', () => {
      Object.defineProperty(navigator, 'userAgentData', {
        value: { mobile: true },
        writable: true,
        configurable: true,
      });

      const deviceType = getDeviceType();

      expect(deviceType).toBe(DeviceType.Mobile);
    });

    it('should detect desktop from userAgentData when available', () => {
      Object.defineProperty(navigator, 'userAgentData', {
        value: { mobile: false },
        writable: true,
        configurable: true,
      });

      const deviceType = getDeviceType();

      expect(deviceType).toBe(DeviceType.Desktop);
    });

    it('should detect tablet from userAgentData platform', () => {
      Object.defineProperty(navigator, 'userAgentData', {
        value: {
          mobile: false,
          platform: 'iPad',
        },
        writable: true,
        configurable: true,
      });

      const deviceType = getDeviceType();

      expect(deviceType).toBe(DeviceType.Tablet);
    });

    it('should detect tablet from platform with tablet keyword', () => {
      Object.defineProperty(navigator, 'userAgentData', {
        value: {
          mobile: false,
          platform: 'Android Tablet',
        },
        writable: true,
        configurable: true,
      });

      const deviceType = getDeviceType();

      expect(deviceType).toBe(DeviceType.Tablet);
    });

    it('should return a valid device type from detection', () => {
      const deviceType = getDeviceType();

      // Should return one of the valid device types
      expect([DeviceType.Mobile, DeviceType.Tablet, DeviceType.Desktop]).toContain(deviceType);
    });

    it('should not throw errors during detection', () => {
      expect(() => getDeviceType()).not.toThrow();
    });

    it('should return consistent results on multiple calls', () => {
      const result1 = getDeviceType();
      const result2 = getDeviceType();
      const result3 = getDeviceType();

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should return a string enum value', () => {
      const deviceType = getDeviceType();

      expect(typeof deviceType).toBe('string');
      expect(deviceType).toBeTruthy();
    });

    it('should detect desktop from large screen', () => {
      Object.defineProperty(navigator, 'userAgentData', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
        configurable: true,
      });

      const deviceType = getDeviceType();

      expect(deviceType).toBe(DeviceType.Desktop);
    });

    it('should detect tablet from media query indicators', () => {
      Object.defineProperty(navigator, 'userAgentData', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(window, 'innerWidth', {
        value: 1200,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        writable: true,
        configurable: true,
      });

      const mockMatchMedia = vi.fn((query: string) => ({
        matches: query === '(pointer: coarse)' || query === '(hover: none)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        value: mockMatchMedia,
        writable: true,
        configurable: true,
      });

      const deviceType = getDeviceType();

      expect(deviceType).toBe(DeviceType.Tablet);
    });

    it('should handle detection errors gracefully and default to desktop', () => {
      Object.defineProperty(navigator, 'userAgentData', {
        get() {
          throw new Error('Access denied');
        },
        configurable: true,
      });

      const deviceType = getDeviceType();

      expect(deviceType).toBe(DeviceType.Desktop);
    });

    it('should detect mobile from Android user agent', () => {
      Object.defineProperty(navigator, 'userAgentData', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) Mobile Safari',
        writable: true,
        configurable: true,
      });

      Object.defineProperty(window, 'innerWidth', {
        value: 400,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        writable: true,
        configurable: true,
      });

      const deviceType = getDeviceType();

      expect(deviceType).toBe(DeviceType.Mobile);
    });

    it('should be one of the three device types', () => {
      const deviceType = getDeviceType();
      const validTypes = Object.values(DeviceType);

      expect(validTypes).toContain(deviceType);
    });

    it('should prioritize userAgentData over other detection methods', () => {
      Object.defineProperty(navigator, 'userAgentData', {
        value: { mobile: true },
        writable: true,
        configurable: true,
      });

      Object.defineProperty(window, 'innerWidth', {
        value: 1920, // Desktop size
        writable: true,
        configurable: true,
      });

      const deviceType = getDeviceType();

      // userAgentData should take precedence
      expect(deviceType).toBe(DeviceType.Mobile);
    });
  });
});
