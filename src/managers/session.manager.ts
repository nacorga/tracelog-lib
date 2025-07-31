import { SESSION_TIMEOUT_MS } from '../app.constants';
import {
  ActivityListenerManager,
  EventListenerManager,
  KeyboardListenerManager,
  MouseListenerManager,
  TouchListenerManager,
  UnloadListenerManager,
  VisibilityListenerManager,
} from '../listeners';
import { DeviceType } from '../types/device.types';
import { generateUUID, getDeviceType } from '../utils';
import { StateManager } from './state.manager';

interface SessionConfig {
  timeout: number;
  throttleDelay: number;
  visibilityTimeout: number;
  motionThreshold: number;
}

interface DeviceCapabilities {
  hasTouch: boolean;
  hasMouse: boolean;
  hasKeyboard: boolean;
  isMobile: boolean;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  timeout: 30_000,
  throttleDelay: 1000,
  visibilityTimeout: 2000,
  motionThreshold: 2,
};

export class SessionManager extends StateManager {
  private readonly config: SessionConfig;
  private readonly onActivity: () => void;
  private readonly onInactivity: () => void;
  private readonly deviceCapabilities: DeviceCapabilities;
  private readonly listenerManagers: EventListenerManager[] = [];

  private isSessionActive = false;
  private lastActivityTime = 0;
  private inactivityTimer: number | null = null;
  private sessionStartTime = 0;
  private throttleTimeout: number | null = null;

  constructor(onActivity: () => void, onInactivity: () => void) {
    super();

    this.config = { ...DEFAULT_SESSION_CONFIG, timeout: this.get('config')?.sessionTimeout ?? SESSION_TIMEOUT_MS };
    this.onActivity = onActivity;
    this.onInactivity = onInactivity;
    this.deviceCapabilities = this.detectDeviceCapabilities();

    this.initializeListenerManagers();
    this.setupAllListeners();
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

    const durationMs = Date.now() - this.sessionStartTime;

    this.sessionStartTime = 0;
    this.isSessionActive = false;

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    return durationMs;
  }

  destroy(): void {
    this.clearTimers();
    this.cleanupAllListeners();
    this.resetState();
  }

  private detectDeviceCapabilities(): DeviceCapabilities {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasMouse = window.matchMedia('(pointer: fine)').matches;
    const hasKeyboard = !window.matchMedia('(pointer: coarse)').matches;
    const isMobile = getDeviceType() === DeviceType.Mobile;

    return { hasTouch, hasMouse, hasKeyboard, isMobile };
  }

  private initializeListenerManagers(): void {
    this.listenerManagers.push(new ActivityListenerManager(this.handleActivity));

    if (this.deviceCapabilities.hasTouch) {
      this.listenerManagers.push(new TouchListenerManager(this.handleActivity, this.config.motionThreshold));
    }

    if (this.deviceCapabilities.hasMouse) {
      this.listenerManagers.push(new MouseListenerManager(this.handleActivity));
    }

    if (this.deviceCapabilities.hasKeyboard) {
      this.listenerManagers.push(new KeyboardListenerManager(this.handleActivity));
    }

    this.listenerManagers.push(
      new VisibilityListenerManager(this.handleActivity, this.handleVisibilityChange, this.deviceCapabilities.isMobile),
    );

    this.listenerManagers.push(new UnloadListenerManager(this.handleInactivity));
  }

  private setupAllListeners(): void {
    this.listenerManagers.forEach((manager) => manager.setup());
  }

  private cleanupAllListeners(): void {
    this.listenerManagers.forEach((manager) => manager.cleanup());
  }

  private clearTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
      this.throttleTimeout = null;
    }
  }

  private resetState(): void {
    this.isSessionActive = false;
    this.lastActivityTime = 0;
    this.sessionStartTime = 0;
  }

  private readonly handleActivity = (): void => {
    const now = Date.now();

    // Throttling: avoid processing very frequent activity
    if (now - this.lastActivityTime < this.config.throttleDelay) {
      return;
    }

    this.lastActivityTime = now;

    if (this.isSessionActive) {
      this.resetInactivityTimer();
    } else {
      // Use throttling for onActivity callback
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
        this.inactivityTimer = window.setTimeout(this.handleInactivity, this.config.visibilityTimeout);
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

    this.inactivityTimer = window.setTimeout(this.handleInactivity, this.config.timeout);
  };
}
