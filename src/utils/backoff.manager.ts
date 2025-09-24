import { debugLog } from './logging';

export interface BackoffConfig {
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
}

export class BackoffManager {
  private currentDelay: number;
  private readonly initialDelay: number;
  private readonly maxDelay: number;
  private readonly multiplier: number;
  private attemptCount = 0;
  private readonly name: string;

  constructor(config: BackoffConfig, name = 'BackoffManager') {
    this.initialDelay = config.initialDelay;
    this.maxDelay = config.maxDelay;
    this.multiplier = config.multiplier;
    this.currentDelay = this.initialDelay;
    this.name = name;

    debugLog.debug(this.name, 'BackoffManager initialized', {
      initialDelay: this.initialDelay,
      maxDelay: this.maxDelay,
      multiplier: this.multiplier,
    });
  }

  getNextDelay(): number {
    const delay = this.currentDelay;
    this.currentDelay = Math.min(this.currentDelay * this.multiplier, this.maxDelay);
    this.attemptCount++;

    debugLog.debug(this.name, 'Backoff delay calculated', {
      currentDelay: delay,
      nextDelay: this.currentDelay,
      attemptCount: this.attemptCount,
    });

    return delay;
  }

  getCurrentDelay(): number {
    return this.currentDelay;
  }

  reset(): void {
    const wasReset = this.currentDelay !== this.initialDelay || this.attemptCount > 0;

    this.currentDelay = this.initialDelay;
    this.attemptCount = 0;

    if (wasReset) {
      debugLog.debug(this.name, 'BackoffManager reset', {
        resetToDelay: this.initialDelay,
      });
    }
  }

  getAttemptCount(): number {
    return this.attemptCount;
  }

  getConfig(): BackoffConfig {
    return {
      initialDelay: this.initialDelay,
      maxDelay: this.maxDelay,
      multiplier: this.multiplier,
    };
  }

  isAtMaxDelay(): boolean {
    return this.currentDelay >= this.maxDelay;
  }
}
