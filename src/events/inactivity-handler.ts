export interface InactivityConfig {
  timeout: number; // Timeout in milliseconds
  events?: string[]; // Events to track for activity
}

export interface InactivityData {
  isInactive: boolean;
  lastActivityTime: number;
  inactiveDuration?: number;
}

export class InactivityHandler {
  private isInactive: boolean = false;
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private lastActivityTime: number = Date.now();
  private readonly defaultEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart', 'touchmove'];
  private eventListeners: Map<string, EventListener> = new Map();
  private eventsToTrack: string[] = [];

  constructor(
    private config: InactivityConfig,
    private onInactivityChange: (data: InactivityData) => void,
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

    this.eventsToTrack.forEach((event) => {
      this.eventListeners.set(event, handleActivity);
      window.addEventListener(event, handleActivity, {
        passive: true,
        capture: true,
      });
    });
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
      return; // No change
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
    // Clear timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    // Remove all event listeners
    this.eventListeners.forEach((listener, event) => {
      window.removeEventListener(event, listener, {
        capture: true,
      });
    });

    // Clear collections
    this.eventListeners.clear();
    this.eventsToTrack = [];
  }

  // Static utility methods for common inactivity scenarios
  static createStandardConfig(timeoutMinutes: number = 5): InactivityConfig {
    return {
      timeout: timeoutMinutes * 60 * 1000, // Convert minutes to milliseconds
      events: ['mousemove', 'keydown', 'scroll', 'click', 'touchstart', 'touchmove'],
    };
  }

  static createMobileOptimizedConfig(timeoutMinutes: number = 3): InactivityConfig {
    return {
      timeout: timeoutMinutes * 60 * 1000,
      events: ['touchstart', 'touchmove', 'touchend', 'scroll', 'click', 'keydown'],
    };
  }

  static createMinimalConfig(timeoutMinutes: number = 10): InactivityConfig {
    return {
      timeout: timeoutMinutes * 60 * 1000,
      events: ['click', 'keydown'], // Only essential events
    };
  }
}
