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
  }

  getNextDelay(): number {
    const delay = this.currentDelay;
    this.currentDelay = Math.min(this.currentDelay * this.multiplier, this.maxDelay);
    this.attemptCount++;
    return delay;
  }

  getCurrentDelay(): number {
    return this.currentDelay;
  }

  reset(): void {
    this.currentDelay = this.initialDelay;
    this.attemptCount = 0;
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
