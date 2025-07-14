import { InactivityConfig, InactivityData } from '../types';

export class InactivityHandler {
  private readonly defaultEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart', 'touchmove'];
  private readonly eventListeners: Map<string, EventListener> = new Map();

  private isInactive = false;
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private lastActivityTime: number = Date.now();
  private eventsToTrack: string[] = [];

  constructor(
    private readonly config: InactivityConfig,
    private readonly onInactivityChange: (data: InactivityData) => void,
  ) {}

  init(): void {
    this.setupActivityListeners();
    this.resetInactivityTimer();
  }

  getInactivityState(): InactivityData {
    return {
      isInactive: this.isInactive,
      lastActivityTime: this.lastActivityTime,
      ...(this.isInactive && {
        inactiveDuration: Date.now() - this.lastActivityTime,
      }),
    };
  }

  forceInactive(): void {
    this.setInactiveState(true);
  }

  forceActive(): void {
    this.setInactiveState(false);
    this.resetInactivityTimer();
  }

  updateTimeout(newTimeout: number): void {
    this.config.timeout = newTimeout;

    if (this.inactivityTimer) {
      this.resetInactivityTimer();
    }
  }

  private setupActivityListeners(): void {
    this.eventsToTrack = this.config.events || this.defaultEvents;

    const handleActivity = this.handleUserActivity.bind(this);

    for (const event of this.eventsToTrack) {
      this.eventListeners.set(event, handleActivity);
      window.addEventListener(event, handleActivity, {
        passive: true,
        capture: true,
      });
    }
  }

  private handleUserActivity(): void {
    this.lastActivityTime = Date.now();

    if (this.isInactive) {
      this.setInactiveState(false);
    }

    this.resetInactivityTimer();
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(() => {
      this.setInactiveState(true);
    }, this.config.timeout);
  }

  private setInactiveState(inactive: boolean): void {
    if (this.isInactive === inactive) {
      return;
    }

    this.isInactive = inactive;

    const inactivityData: InactivityData = {
      isInactive: inactive,
      lastActivityTime: this.lastActivityTime,
      ...(inactive && {
        inactiveDuration: Date.now() - this.lastActivityTime,
      }),
    };

    this.onInactivityChange(inactivityData);
  }

  cleanup(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    for (const [event, listener] of this.eventListeners.entries()) {
      window.removeEventListener(event, listener, {
        capture: true,
      });
    }

    this.eventListeners.clear();
    this.eventsToTrack = [];
  }

  // Static utility methods for common inactivity scenarios
  static createStandardConfig(timeoutMinutes = 5): InactivityConfig {
    return {
      timeout: timeoutMinutes * 60 * 1000,
      events: ['mousemove', 'keydown', 'scroll', 'click', 'touchstart', 'touchmove'],
    };
  }

  static createMobileOptimizedConfig(timeoutMinutes = 3): InactivityConfig {
    return {
      timeout: timeoutMinutes * 60 * 1000,
      events: ['touchstart', 'touchmove', 'touchend', 'scroll', 'click', 'keydown'],
    };
  }

  static createMinimalConfig(timeoutMinutes = 10): InactivityConfig {
    return {
      timeout: timeoutMinutes * 60 * 1000,
      events: ['click', 'keydown'], // Only essential events
    };
  }
}
