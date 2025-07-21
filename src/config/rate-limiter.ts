import { MAX_FETCH_ATTEMPTS, RATE_LIMIT_MS } from '../constants';

export interface IRateLimiter {
  canFetch(): boolean;
  recordAttempt(): void;
  reset(): void;
  getAttempts(): number;
  getLastAttempt(): number;
  hasExceededMaxAttempts(): boolean;
}

export class RateLimiter implements IRateLimiter {
  private lastAttempt = 0;
  private attempts = 0;

  canFetch(): boolean {
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastAttempt;
    const hasExceededRateLimit = timeSinceLastAttempt < RATE_LIMIT_MS;
    const hasExceededMaxAttempts = this.attempts >= MAX_FETCH_ATTEMPTS;

    return !hasExceededRateLimit && !hasExceededMaxAttempts;
  }

  recordAttempt(): void {
    this.lastAttempt = Date.now();
    this.attempts++;
  }

  reset(): void {
    this.attempts = 0;
    this.lastAttempt = 0;
  }

  getAttempts(): number {
    return this.attempts;
  }

  getLastAttempt(): number {
    return this.lastAttempt;
  }

  hasExceededMaxAttempts(): boolean {
    return this.attempts >= MAX_FETCH_ATTEMPTS;
  }
}
