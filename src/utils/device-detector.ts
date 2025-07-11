import { DeviceType } from '../constants';

// Cache media queries for better performance
let coarsePointerQuery: MediaQueryList | null = null;
let noHoverQuery: MediaQueryList | null = null;

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

export const getDeviceType = (): DeviceType => {
  try {
    const nav = navigator as NavigatorWithUserAgentData;

    // Try modern User-Agent Client Hints API first
    if (nav.userAgentData && typeof nav.userAgentData.mobile === 'boolean') {
      if (nav.userAgentData.platform && /ipad|tablet/i.test(nav.userAgentData.platform)) {
        return DeviceType.Tablet;
      }
      return nav.userAgentData.mobile ? DeviceType.Mobile : DeviceType.Desktop;
    }

    // Initialize media queries on first call
    initMediaQueries();

    const width = window.innerWidth;
    const hasCoarsePointer = coarsePointerQuery?.matches ?? false;
    const hasNoHover = noHoverQuery?.matches ?? false;
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const ua = navigator.userAgent.toLowerCase();
    const isMobileUA = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua);
    const isTabletUA = /tablet|ipad|android(?!.*mobile)/.test(ua);

    // Mobile detection: small screen OR mobile UA with touch
    if (width <= 767 || (isMobileUA && hasTouchSupport)) {
      return DeviceType.Mobile;
    }

    // Tablet detection: medium screen OR tablet UA OR touch with coarse pointer and no hover
    if ((width >= 768 && width <= 1024) || isTabletUA || (hasCoarsePointer && hasNoHover && hasTouchSupport)) {
      return DeviceType.Tablet;
    }

    return DeviceType.Desktop;
  } catch (err) {
    return DeviceType.Unknown;
  }
};
