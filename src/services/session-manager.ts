import { DeviceType } from '../types/device.types';
import { getDeviceType } from '../utils/device-detector.utils';
import { generateUUID } from '../utils/uuid.utils';

interface DeviceCapabilities {
  hasTouch: boolean;
  hasMouse: boolean;
  hasKeyboard: boolean;
  isMobile: boolean;
}

export class SessionManager {
  private readonly sessionTimeout: number;
  private readonly onActivity: () => void;
  private readonly onInactivity: () => void;
  private readonly deviceCapabilities: DeviceCapabilities;

  private isSessionActive = false;
  private lastActivityTime = 0;
  private inactivityTimer: number | null = null;
  private sessionStartTime: number;
  private throttleTimeout: number | null = null;

  // Optimización constants
  private readonly THROTTLE_DELAY = 1000; // 1 second between activity detections
  private readonly VISIBILITY_TIMEOUT = 2000; // 2 seconds to consider tab inactive

  constructor(sessionTimeout: number, onActivity: () => void, onInactivity: () => void) {
    this.sessionTimeout = sessionTimeout;
    this.onActivity = onActivity;
    this.onInactivity = onInactivity;
    this.sessionStartTime = 0;
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.setupActivityListeners();
    this.setupVisibilityListeners();
  }

  startSession(): string {
    this.sessionStartTime = Date.now();
    this.isSessionActive = true;
    this.lastActivityTime = Date.now();
    this.resetInactivityTimer();

    return generateUUID();
  }

  endSession(): number {
    if (this.sessionStartTime === 0) {
      return 0;
    }

    this.sessionStartTime = 0;
    this.isSessionActive = false;

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    const durationMs = Date.now() - this.sessionStartTime;

    return durationMs;
  }

  private detectDeviceCapabilities(): DeviceCapabilities {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasMouse = window.matchMedia('(pointer: fine)').matches;
    const hasKeyboard = !window.matchMedia('(pointer: coarse)').matches;
    const isMobile = getDeviceType() === DeviceType.Mobile;

    return { hasTouch, hasMouse, hasKeyboard, isMobile };
  }

  private readonly handleActivity = (): void => {
    const now = Date.now();

    // Throttling: avoid processing very frequent activity
    if (now - this.lastActivityTime < this.THROTTLE_DELAY) {
      return;
    }

    this.lastActivityTime = now;

    if (this.isSessionActive) {
      this.resetInactivityTimer();
    } else {
      // Use throttling also for onActivity
      if (this.throttleTimeout) {
        clearTimeout(this.throttleTimeout);
      }

      this.throttleTimeout = window.setTimeout(() => {
        this.onActivity();
        this.throttleTimeout = null;
      }, 100);
    }
  };

  private readonly handleInactivity = (): void => {
    this.onInactivity();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      // Hidden page: reduce inactivity timeout
      if (this.isSessionActive) {
        if (this.inactivityTimer) {
          clearTimeout(this.inactivityTimer);
        }
        this.inactivityTimer = window.setTimeout(this.handleInactivity, this.VISIBILITY_TIMEOUT);
      }
    } else {
      // Visible page: treat as activity
      this.handleActivity();
    }
  };

  private readonly resetInactivityTimer = (): void => {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = window.setTimeout(this.handleInactivity, this.sessionTimeout);
  };

  private setupActivityListeners(): void {
    const options = { passive: true };

    // Universal events
    window.addEventListener('scroll', this.handleActivity, options);
    window.addEventListener('resize', this.handleActivity, options);
    window.addEventListener('focus', this.handleActivity, options);

    // Device-specific events
    if (this.deviceCapabilities.hasTouch) {
      // Touch devices (mobile and tablets)
      window.addEventListener('touchstart', this.handleActivity, options);
      window.addEventListener('touchmove', this.handleActivity, options);
      window.addEventListener('touchend', this.handleActivity, options);
      window.addEventListener('orientationchange', this.handleActivity, options);

      // DeviceMotion to detect physical device movement
      if ('DeviceMotionEvent' in window) {
        window.addEventListener('devicemotion', this.throttledDeviceMotion.bind(this), options);
      }
    }

    if (this.deviceCapabilities.hasMouse) {
      // Mouse devices (desktop)
      window.addEventListener('mousemove', this.handleActivity, options);
      window.addEventListener('mousedown', this.handleActivity, options);
      window.addEventListener('wheel', this.handleActivity, options);
    } else {
      // Fallback for touch devices without mouse
      window.addEventListener('click', this.handleActivity, options);
    }

    if (this.deviceCapabilities.hasKeyboard) {
      // Keyboard devices
      window.addEventListener('keydown', this.handleActivity, options);
      window.addEventListener('keypress', this.handleActivity, options);
    }

    // Additional events for mobile devices
    if (this.deviceCapabilities.isMobile) {
      window.addEventListener('pageshow', this.handleActivity, options);
      window.addEventListener('pagehide', this.handleActivity, options);
    }
  }

  private setupVisibilityListeners(): void {
    // Page Visibility API - critical for inactivity detection
    if ('visibilityState' in document) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange, { passive: true });
    }

    // Fallback for older browsers
    window.addEventListener('blur', this.handleVisibilityChange, { passive: true });
    window.addEventListener('focus', this.handleActivity, { passive: true });

    // Detect when the user tries to exit
    window.addEventListener('beforeunload', this.handleActivity, { passive: true });

    // Network connectivity (basic web app requirement)
    if ('onLine' in navigator) {
      window.addEventListener('online', this.handleActivity, { passive: true });
      window.addEventListener('offline', this.handleVisibilityChange, { passive: true });
    }

    // Mobile-specific lifecycle events
    if (this.deviceCapabilities.isMobile) {
      // iOS/Android app lifecycle
      document.addEventListener('pause', this.handleVisibilityChange, { passive: true });
      document.addEventListener('resume', this.handleActivity, { passive: true });

      // Orientation changes (user interaction indicator)
      if ('orientation' in screen) {
        screen.orientation.addEventListener('change', this.handleActivity, { passive: true });
      }
    }
  }

  private throttledDeviceMotion(event: DeviceMotionEvent): void {
    const acceleration = event.acceleration;

    if (acceleration) {
      const totalAcceleration =
        Math.abs(acceleration.x ?? 0) + Math.abs(acceleration.y ?? 0) + Math.abs(acceleration.z ?? 0);

      // Threshold to consider significant movement
      if (totalAcceleration > 2) {
        this.handleActivity();
      }
    }
  }
}
