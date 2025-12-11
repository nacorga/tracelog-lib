/**
 * Device Detector Tests
 * Focus: OS and browser detection with modern API and fallback
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDeviceType, getDeviceInfo } from '../../../../src/utils/browser/device-detector.utils';
import { DeviceType } from '../../../../src/types/device.types';

describe('Device Detector', () => {
  const originalNavigator = window.navigator;
  const originalWindow = { ...window };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset navigator
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    // Reset window properties
    Object.defineProperty(window, 'innerWidth', {
      value: originalWindow.innerWidth,
      writable: true,
      configurable: true,
    });
  });

  describe('getDeviceType', () => {
    it('should return Desktop for desktop browser with userAgentData', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgentData: {
            mobile: false,
            platform: 'macOS',
          },
        },
        writable: true,
        configurable: true,
      });

      expect(getDeviceType()).toBe(DeviceType.Desktop);
    });

    it('should return Mobile for mobile browser with userAgentData', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgentData: {
            mobile: true,
            platform: 'Android',
          },
        },
        writable: true,
        configurable: true,
      });

      expect(getDeviceType()).toBe(DeviceType.Mobile);
    });

    it('should return Tablet for iPad with userAgentData', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgentData: {
            mobile: false,
            platform: 'iPad',
          },
        },
        writable: true,
        configurable: true,
      });

      expect(getDeviceType()).toBe(DeviceType.Tablet);
    });
  });

  describe('getDeviceInfo', () => {
    describe('OS Detection', () => {
      it('should detect Windows from userAgentData.platform', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: {
              mobile: false,
              platform: 'Windows',
              brands: [{ brand: 'Google Chrome', version: '120' }],
            },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();
        expect(info.os).toBe('Windows');
      });

      it('should detect macOS from userAgentData.platform', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: {
              mobile: false,
              platform: 'macOS',
              brands: [{ brand: 'Google Chrome', version: '120' }],
            },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();
        expect(info.os).toBe('macOS');
      });

      it('should detect Android from userAgentData.platform', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: {
              mobile: true,
              platform: 'Android',
              brands: [{ brand: 'Google Chrome', version: '120' }],
            },
            userAgent: 'Mozilla/5.0 (Linux; Android 13)',
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();
        expect(info.os).toBe('Android');
      });

      it('should detect iOS from userAgent string fallback', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: undefined,
            userAgent:
              'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            maxTouchPoints: 5,
          },
          writable: true,
          configurable: true,
        });

        Object.defineProperty(window, 'innerWidth', { value: 390, writable: true, configurable: true });

        const info = getDeviceInfo();
        expect(info.os).toBe('iOS');
      });

      it('should detect macOS from userAgent string fallback', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: undefined,
            userAgent:
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            maxTouchPoints: 0,
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();
        expect(info.os).toBe('macOS');
      });

      it('should detect Linux from userAgent string fallback', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: undefined,
            userAgent:
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            maxTouchPoints: 0,
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();
        expect(info.os).toBe('Linux');
      });

      it('should detect ChromeOS from userAgent string fallback', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: undefined,
            userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            maxTouchPoints: 0,
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();
        expect(info.os).toBe('ChromeOS');
      });

      it('should return Unknown for unrecognized OS', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: undefined,
            userAgent: 'SomeUnknownBrowser/1.0',
            maxTouchPoints: 0,
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();
        expect(info.os).toBe('Unknown');
      });
    });

    describe('Browser Detection', () => {
      it('should detect Chrome from userAgentData.brands', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: {
              mobile: false,
              platform: 'macOS',
              brands: [
                { brand: 'Not_A Brand', version: '8' },
                { brand: 'Chromium', version: '120' },
                { brand: 'Google Chrome', version: '120' },
              ],
            },
            userAgent: 'Mozilla/5.0 Chrome/120.0.0.0',
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();
        expect(info.browser).toBe('Chrome');
      });

      it('should detect Edge from userAgentData.brands', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: {
              mobile: false,
              platform: 'Windows',
              brands: [
                { brand: 'Not_A Brand', version: '8' },
                { brand: 'Chromium', version: '120' },
                { brand: 'Microsoft Edge', version: '120' },
              ],
            },
            userAgent: 'Mozilla/5.0 Edg/120.0.0.0',
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();
        expect(info.browser).toBe('Edge');
      });

      it('should detect Safari from userAgent string fallback', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: undefined,
            userAgent:
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            maxTouchPoints: 0,
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();
        expect(info.browser).toBe('Safari');
      });

      it('should detect Firefox from userAgent string fallback', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: undefined,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            maxTouchPoints: 0,
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();
        expect(info.browser).toBe('Firefox');
      });

      it('should detect Edge from userAgent string fallback', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: undefined,
            userAgent:
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
            maxTouchPoints: 0,
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();
        expect(info.browser).toBe('Edge');
      });

      it('should detect Opera from userAgent string fallback', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: undefined,
            userAgent:
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
            maxTouchPoints: 0,
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();
        expect(info.browser).toBe('Opera');
      });

      it('should return Unknown for unrecognized browser', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: undefined,
            userAgent: 'UnknownBrowser/1.0',
            maxTouchPoints: 0,
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();
        expect(info.browser).toBe('Unknown');
      });
    });

    describe('Complete DeviceInfo', () => {
      it('should return complete DeviceInfo object', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            ...originalNavigator,
            userAgentData: {
              mobile: false,
              platform: 'macOS',
              brands: [{ brand: 'Google Chrome', version: '120' }],
            },
            userAgent: 'Mozilla/5.0 (Macintosh) Chrome/120',
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();

        expect(info).toEqual({
          type: DeviceType.Desktop,
          os: 'macOS',
          browser: 'Chrome',
        });
      });

      it('should handle errors gracefully and return defaults', () => {
        Object.defineProperty(window, 'navigator', {
          value: {
            get userAgentData() {
              throw new Error('Access denied');
            },
            get userAgent() {
              throw new Error('Access denied');
            },
          },
          writable: true,
          configurable: true,
        });

        const info = getDeviceInfo();

        expect(info).toEqual({
          type: DeviceType.Desktop,
          os: 'Unknown',
          browser: 'Unknown',
        });
      });
    });
  });
});
