import { DeviceInfo, DeviceType } from '../../types/device.types';
import { log } from '../logging.utils';

let coarsePointerQuery: MediaQueryList | undefined;
let noHoverQuery: MediaQueryList | undefined;

const initMediaQueries = (): void => {
  if (typeof window !== 'undefined' && !coarsePointerQuery) {
    coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    noHoverQuery = window.matchMedia('(hover: none)');
  }
};

interface UserAgentBrand {
  brand: string;
  version: string;
}

interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: {
    mobile: boolean;
    platform?: string;
    brands?: UserAgentBrand[];
  };
}

const UNKNOWN = 'Unknown';

/**
 * Detects OS name from navigator.userAgentData (modern) or userAgent string (fallback)
 */
const detectOS = (nav: NavigatorWithUserAgentData): string => {
  // Modern API (Chromium 90+)
  const platform = nav.userAgentData?.platform;
  if (platform != null && platform !== '') {
    if (/windows/i.test(platform)) return 'Windows';
    if (/macos/i.test(platform)) return 'macOS';
    if (/android/i.test(platform)) return 'Android';
    if (/linux/i.test(platform)) return 'Linux';
    if (/chromeos/i.test(platform)) return 'ChromeOS';
    if (/ios/i.test(platform)) return 'iOS';
  }

  // Fallback: Parse userAgent string
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'Windows';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/CrOS/i.test(ua)) return 'ChromeOS';
  if (/Linux/i.test(ua)) return 'Linux';

  return UNKNOWN;
};

/**
 * Detects browser name from navigator.userAgentData.brands (modern) or userAgent string (fallback)
 */
const detectBrowser = (nav: NavigatorWithUserAgentData): string => {
  // Modern API (Chromium 90+)
  const brands = nav.userAgentData?.brands;
  if (brands != null && brands.length > 0) {
    // Filter out generic brands and find the actual browser
    const validBrands = brands.filter((b) => !/not.?a.?brand|chromium/i.test(b.brand));
    const firstBrand = validBrands[0];
    if (firstBrand != null) {
      const brand = firstBrand.brand;
      // Normalize brand names
      if (/google chrome/i.test(brand)) return 'Chrome';
      if (/microsoft edge/i.test(brand)) return 'Edge';
      if (/opera/i.test(brand)) return 'Opera';
      return brand;
    }
  }

  // Fallback: Parse userAgent string (order matters!)
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\//i.test(ua)) return 'Opera';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';

  return UNKNOWN;
};

/**
 * Detects the device type based on screen size, user agent, and browser capabilities
 * @returns The detected device type
 */
export const getDeviceType = (): DeviceType => {
  try {
    const nav = navigator as NavigatorWithUserAgentData;

    if (nav.userAgentData != null && typeof nav.userAgentData.mobile === 'boolean') {
      const uaPlatform = nav.userAgentData.platform;
      if (uaPlatform != null && uaPlatform !== '' && /ipad|tablet/i.test(uaPlatform)) {
        return DeviceType.Tablet;
      }

      const result = nav.userAgentData.mobile ? DeviceType.Mobile : DeviceType.Desktop;
      return result;
    }

    initMediaQueries();

    const width = window.innerWidth;
    const hasCoarsePointer = coarsePointerQuery?.matches ?? false;
    const hasNoHover = noHoverQuery?.matches ?? false;
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const ua = navigator.userAgent.toLowerCase();
    const isMobileUA = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua);
    const isTabletUA = /tablet|ipad|android(?!.*mobile)/.test(ua);

    if (width <= 767 || (isMobileUA && hasTouchSupport)) {
      return DeviceType.Mobile;
    }

    if ((width >= 768 && width <= 1024) || isTabletUA || (hasCoarsePointer && hasNoHover && hasTouchSupport)) {
      return DeviceType.Tablet;
    }

    return DeviceType.Desktop;
  } catch (error) {
    log('debug', 'Device detection failed, defaulting to desktop', { error });

    return DeviceType.Desktop;
  }
};

/**
 * Detects comprehensive device information including type, OS, and browser.
 *
 * Uses navigator.userAgentData (modern Chromium 90+) with userAgent string fallback.
 *
 * @returns DeviceInfo object with type, os, and browser fields
 */
export const getDeviceInfo = (): DeviceInfo => {
  try {
    const nav = navigator as NavigatorWithUserAgentData;

    return {
      type: getDeviceType(),
      os: detectOS(nav),
      browser: detectBrowser(nav),
    };
  } catch (error) {
    log('debug', 'Device info detection failed, using defaults', { error });

    return {
      type: DeviceType.Desktop,
      os: UNKNOWN,
      browser: UNKNOWN,
    };
  }
};
