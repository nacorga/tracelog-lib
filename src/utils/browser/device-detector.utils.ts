import { DeviceType } from '../../types/device.types';
import { log } from '../logging.utils';

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
    const nav = navigator as NavigatorWithUserAgentData;

    if (nav.userAgentData && typeof nav.userAgentData.mobile === 'boolean') {
      if (nav.userAgentData.platform && /ipad|tablet/i.test(nav.userAgentData.platform)) {
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
    log('warn', 'Device detection failed, defaulting to desktop', { error });

    return DeviceType.Desktop;
  }
};
