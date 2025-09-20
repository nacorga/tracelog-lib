import { DeviceType } from '../../types/device.types';
import { debugLog } from '../logging';

let coarsePointerQuery: MediaQueryList | undefined;
let noHoverQuery: MediaQueryList | undefined;

const initMediaQueries = (): void => {
  if (typeof window !== 'undefined' && !coarsePointerQuery) {
    coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    noHoverQuery = window.matchMedia('(hover: none)');
  }
};

interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: {
    mobile: boolean;
    platform?: string;
  };
}

/**
 * Detects the device type based on screen size, user agent, and browser capabilities
 * @returns The detected device type
 */
export const getDeviceType = (): DeviceType => {
  try {
    debugLog.debug('DeviceDetector', 'Starting device detection');
    const nav = navigator as NavigatorWithUserAgentData;

    if (nav.userAgentData && typeof nav.userAgentData.mobile === 'boolean') {
      debugLog.debug('DeviceDetector', 'Using modern User-Agent Client Hints API', {
        mobile: nav.userAgentData.mobile,
        platform: nav.userAgentData.platform,
      });

      if (nav.userAgentData.platform && /ipad|tablet/i.test(nav.userAgentData.platform)) {
        debugLog.debug('DeviceDetector', 'Device detected as tablet via platform hint');
        return DeviceType.Tablet;
      }

      const result = nav.userAgentData.mobile ? DeviceType.Mobile : DeviceType.Desktop;
      debugLog.debug('DeviceDetector', 'Device detected via User-Agent hints', { result });
      return result;
    }

    debugLog.debug('DeviceDetector', 'Using fallback detection methods');
    initMediaQueries();

    const width = window.innerWidth;
    const hasCoarsePointer = coarsePointerQuery?.matches ?? false;
    const hasNoHover = noHoverQuery?.matches ?? false;
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const ua = navigator.userAgent.toLowerCase();
    const isMobileUA = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua);
    const isTabletUA = /tablet|ipad|android(?!.*mobile)/.test(ua);

    const detectionData = {
      width,
      hasCoarsePointer,
      hasNoHover,
      hasTouchSupport,
      isMobileUA,
      isTabletUA,
      maxTouchPoints: navigator.maxTouchPoints,
    };

    if (width <= 767 || (isMobileUA && hasTouchSupport)) {
      debugLog.debug('DeviceDetector', 'Device detected as mobile', detectionData);
      return DeviceType.Mobile;
    }

    if ((width >= 768 && width <= 1024) || isTabletUA || (hasCoarsePointer && hasNoHover && hasTouchSupport)) {
      debugLog.debug('DeviceDetector', 'Device detected as tablet', detectionData);
      return DeviceType.Tablet;
    }

    debugLog.debug('DeviceDetector', 'Device detected as desktop', detectionData);
    return DeviceType.Desktop;
  } catch (error) {
    debugLog.warn('DeviceDetector', 'Device detection failed, defaulting to desktop', {
      error: error instanceof Error ? error.message : error,
    });
    return DeviceType.Desktop;
  }
};
