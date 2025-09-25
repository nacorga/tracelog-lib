/**
 * Simple Circuit Breaker Pattern
 * Prevents cascading failures by stopping requests after consecutive failures
 * and automatically recovering after a delay
 */
export class SimpleCircuitBreaker {
  private failureCount = 0;
  private isOpen = false;
  private openTime = 0;

  private readonly MAX_FAILURES = 5;
  private readonly RECOVERY_DELAY_MS = 30000; // 30 seconds

  /**
   * Records a failure and opens the circuit if max failures reached
   */
  recordFailure(): void {
    this.failureCount++;

    if (this.failureCount >= this.MAX_FAILURES) {
      this.open();
    }
  }

  /**
   * Records a success and closes the circuit, resetting failure count
   */
  recordSuccess(): void {
    this.failureCount = 0;
    this.close();
  }

  /**
   * Checks if an attempt can be made
   * Returns true if circuit is closed or recovery delay has elapsed
   */
  canAttempt(): boolean {
    if (!this.isOpen) return true;

    const timeSinceOpen = Date.now() - this.openTime;

    if (timeSinceOpen >= this.RECOVERY_DELAY_MS) {
      this.close();
      return true;
    }

    return false;
  }

  /**
   * Gets the current state of the circuit breaker
   */
  getState(): { isOpen: boolean; failureCount: number } {
    return {
      isOpen: this.isOpen,
      failureCount: this.failureCount,
    };
  }

  private open(): void {
    this.isOpen = true;
    this.openTime = Date.now();
    console.warn('Circuit breaker opened - too many failures');
  }

  private close(): void {
    this.isOpen = false;
    this.openTime = 0;
    this.failureCount = 0;
  }
}
